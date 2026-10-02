/* Genera sql/catalogo-lote1.sql y copia las fotos a uploads/ a partir del paquete de catálogo
   (carpeta con catalogo_arecold.json, fotos/ y marcas/).

   Uso (desde la carpeta del proyecto):  node sql/importar-lote.js <carpeta-del-paquete>

   El .sql se importa en phpMyAdmin (pestaña "Importar"), igual que arecold-base-inicial.sql.
   Es repetible: usa INSERT IGNORE y no pisa productos que ya existan ni lo que se editó en el panel.
   Las fotos (uploads/) no van a Git: hay que subir esa carpeta al servidor por FTP/Administrador de archivos. */

const fs = require("fs");
const path = require("path");

const src = path.resolve(process.argv[2] || "");
if (!process.argv[2] || !fs.existsSync(path.join(src, "catalogo_arecold.json"))) {
  console.error("Uso: node sql/importar-lote.js <carpeta con catalogo_arecold.json>");
  process.exit(1);
}
const root = path.resolve(__dirname, "..");
const PHOTOS_DIR = "uploads/products/catalogo";
const BRANDS_DIR = "uploads/brands";

const CATEGORY_SLUG = { "Cocción": "coccion", "Campanas": "campanas", "Termotanques": "termotanques" };
/* Subcategorías: [categoría, slug, nombre, posición]. Las de Termotanques "a-gas" y "electricos" ya existen. */
const SUBCATEGORIES = [
  ["coccion", "cocinas-a-gas", "Cocinas a gas", 10],
  ["coccion", "cocinas-electricas", "Cocinas eléctricas", 11],
  ["coccion", "hornos-electricos", "Hornos eléctricos", 12],
  ["coccion", "anafes-a-gas", "Anafes a gas", 13],
  ["coccion", "anafes-electricos", "Anafes eléctricos", 14],
  ["coccion", "placas-de-induccion", "Placas de inducción", 15],
  ["coccion", "barbacoas-y-hornos-a-lena", "Barbacoas y hornos a leña", 16],
  ["termotanques", "a-gas", "A gas", 0],
  ["termotanques", "electricos", "Eléctricos", 1],
  ["termotanques", "calefones", "Calefones", 2],
  ["campanas", "barbacoas", "Barbacoas", 0],
];
const SUBCATEGORY_SLUG = {
  "Cocinas a gas": "cocinas-a-gas", "Cocinas eléctricas": "cocinas-electricas", "Hornos eléctricos": "hornos-electricos",
  "Anafes a gas": "anafes-a-gas", "Anafes eléctricos": "anafes-electricos", "Placas de inducción": "placas-de-induccion",
  "Barbacoas y hornos a leña": "barbacoas-y-hornos-a-lena", "A gas": "a-gas", "Eléctricos": "electricos",
  "Calefones": "calefones", "Barbacoas": "barbacoas",
};
/* Kohinoor: las carpetas de fotos vienen duplicadas por nombres de archivo (KFVA258, KFVA25-8, KFVA258.png…).
   Se agrupan por modelo; el orden de fotos sigue el orden de esta lista. */
const KOHINOOR_MODEL = {
  "kohinoor-kfva25-8": "KFVA25-8", "kohinoor-kfva258": "KFVA25-8", "kohinoor-kfva258-png": "KFVA25-8",
  "kohinoor-kfva31ni-9-1-jpg": "KFVA31NI-9", "kohinoor-kfva31ni-9-2-jpg": "KFVA31NI-9", "kohinoor-kfva31ni-9-3-jpg": "KFVA31NI-9",
  "kohinoor-khg40": "KHG40", "kohinoor-khg40-png": "KHG40",
  "kohinoor-khg40-9": "KHG40-9", "kohinoor-khga40": "KHGA40",
};

const q = (v) => "'" + String(v).replace(/[\\'\n\r\0\x1a]/g, (c) => ({ "\\": "\\\\", "'": "\\'", "\n": "\\n", "\r": "\\r", "\0": "\\0", "\x1a": "\\Z" })[c]) + "'";
const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ---------- Productos: agrupar Kohinoor y normalizar ---------- */
const raw = JSON.parse(fs.readFileSync(path.join(src, "catalogo_arecold.json"), "utf8"));
const products = [];
const kohinoor = new Map();
for (const p of raw) {
  if (p.marca === "Kohinoor") {
    const model = KOHINOOR_MODEL[p.slug];
    if (!model) throw new Error("Kohinoor sin modelo asignado: " + p.slug);
    if (!kohinoor.has(model)) {
      kohinoor.set(model, { slug: "kohinoor-" + slugify(model), name: model, categoria: "Cocción", subcategoria: "", fotos: [], active: false, features: [] });
    }
    kohinoor.get(model).fotos.push(...p.fotos);
  } else {
    const features = p.descripcion.split("|").map((f) => f.replace(/^[\s•\-–]+/, "").replace(/\s+/g, " ").trim()).filter(Boolean);
    products.push({ slug: p.slug, name: p.nombre, categoria: p.categoria, subcategoria: p.subcategoria, fotos: p.fotos, active: true, features });
  }
}
products.push(...kohinoor.values());

/* El id de producto admite hasta 40 caracteres */
const usedIds = new Set();
for (const p of products) {
  let id = p.slug.slice(0, 40).replace(/-+$/, "");
  for (let n = 2; usedIds.has(id); n++) id = p.slug.slice(0, 40 - String(n).length - 1).replace(/-+$/, "") + "-" + n; // el recorte puede repetir ids
  usedIds.add(id);
  p.id = id;
}

/* ---------- Fotos ---------- */
fs.rmSync(path.join(root, PHOTOS_DIR), { recursive: true, force: true });
let photoCount = 0;
for (const p of products) {
  p.images = [];
  p.fotos.forEach((rel, i) => {
    const from = path.join(src, "fotos", rel);
    const ext = path.extname(rel).toLowerCase();
    const to = `${PHOTOS_DIR}/${p.id}/${p.id}-${i + 1}${ext}`;
    fs.mkdirSync(path.dirname(path.join(root, to)), { recursive: true });
    fs.copyFileSync(from, path.join(root, to));
    p.images.push(to);
    photoCount++;
  });
}
const brands = [
  { name: "Ormay", file: "ormay-logo.jpg" },
  { name: "Kohinoor", file: "kohinoor-logo.png" },
];
fs.mkdirSync(path.join(root, BRANDS_DIR), { recursive: true });
for (const b of brands) {
  b.logo = `${BRANDS_DIR}/${b.file}`;
  fs.copyFileSync(path.join(src, "marcas", b.file), path.join(root, b.logo));
}

/* ---------- SQL ---------- */
const out = [];
out.push("-- Catálogo real, lote 1: Ormay (completo) + Kohinoor (solo fotos, inactivos).");
out.push("-- Generado con: node sql/importar-lote.js <carpeta del paquete>");
out.push("-- Importar en phpMyAdmin → Importar. Se puede repetir: no pisa lo que ya existe.");
out.push("-- ANTES de importar, subir la carpeta uploads/ (products/catalogo y brands) al servidor.");
out.push("");
out.push("SET NAMES utf8mb4;");
out.push("SET FOREIGN_KEY_CHECKS = 0;");
out.push("");
out.push("-- Subcategorías (las que ya existan con el mismo identificador se respetan)");
for (const [cat, slug, name, pos] of SUBCATEGORIES) {
  out.push(`INSERT IGNORE INTO subcategories (category_id, slug, name, position) SELECT id, ${q(slug)}, ${q(name)}, ${pos} FROM categories WHERE slug = ${q(cat)};`);
}
out.push("");
out.push("-- Productos");
for (const p of products) {
  const cat = CATEGORY_SLUG[p.categoria];
  if (!cat) throw new Error("Categoría desconocida: " + p.categoria);
  const sub = p.subcategoria ? SUBCATEGORY_SLUG[p.subcategoria] : "";
  if (p.subcategoria && !sub) throw new Error("Subcategoría desconocida: " + p.subcategoria);
  if (p.features.some((f) => f.length > 200)) throw new Error("Característica de más de 200 caracteres en " + p.id);
  out.push(
    `INSERT IGNORE INTO products (id, category_id, subcategory_id, name, active, description, features) ` +
      `SELECT ${q(p.id)}, c.id, ${sub ? "s.id" : "NULL"}, ${q(p.name)}, ${p.active ? 1 : 0}, '', ${q(JSON.stringify(p.features))} ` +
      `FROM categories c ${sub ? `LEFT JOIN subcategories s ON s.category_id = c.id AND s.slug = ${q(sub)} ` : ""}WHERE c.slug = ${q(cat)};`
  );
  p.images.forEach((img, i) => out.push(`INSERT IGNORE INTO product_images (product_id, path, position) VALUES (${q(p.id)}, ${q(img)}, ${i});`));
}
out.push("");
out.push("-- Marcas con logo (se agregan al final del carrusel solo si todavía no están)");
out.push("INSERT IGNORE INTO settings (name, value) VALUES ('brands', '[]');");
for (const b of brands) {
  const item = JSON.stringify({ name: b.name, logo: b.logo });
  out.push(`UPDATE settings SET value = JSON_ARRAY_APPEND(value, '$', JSON_OBJECT('name', ${q(b.name)}, 'logo', ${q(b.logo)})) WHERE name = 'brands' AND INSTR(value, ${q(b.file)}) = 0; -- ${item}`);
}
out.push("");
out.push("SET FOREIGN_KEY_CHECKS = 1;");
out.push("");
fs.writeFileSync(path.join(__dirname, "catalogo-lote1.sql"), out.join("\n"));

const active = products.filter((p) => p.active).length;
console.log(`Listo: ${products.length} productos (${active} activos, ${products.length - active} inactivos), ${photoCount} fotos, ${brands.length} logos.`);
