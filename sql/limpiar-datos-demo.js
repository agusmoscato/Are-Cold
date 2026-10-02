/* Genera sql/limpiar-datos-demo.sql: borra de la base los datos de EJEMPLO de la demo
   (data/datos-de-ejemplo.js) sin tocar el catálogo real importado.

   Uso:  node sql/limpiar-datos-demo.js

   Criterio, para no borrar nada real:
   - Producto de ejemplo = mismo id Y mismo nombre que en datos-de-ejemplo.js. Si coincide el id pero
     el nombre cambió (alguien lo editó), NO se borra: queda inactivo para revisarlo.
   - Subcategorías "Cocinas" y "Anafes" de Cocción: se borran (las reemplazan las del lote real).
   - Resto de subcategorías de ejemplo: quedan en un bloque comentado, a confirmar. */

const fs = require("fs");
const path = require("path");
global.window = {};
require(path.join(__dirname, "..", "data", "datos-de-ejemplo.js"));
const demo = window.AECOLD_DEMO;
const q = (s) => "'" + String(s).replace(/[\']/g, "\$&") + "'";

const out = [];
out.push("-- Limpieza de datos de EJEMPLO de la demo. Generado con: node sql/limpiar-datos-demo.js");
out.push("-- Importar en phpMyAdmin. Antes, mirar la vista previa (SELECT) para confirmar qué se va a borrar.");
out.push("");
out.push("-- ===== 1. VISTA PREVIA: qué se borraría (ejecutar solo este SELECT si querés revisar antes) =====");
const pairs = demo.products.map((p) => `(${q(p.id)}, ${q(p.name)})`).join(", ");
out.push(`-- SELECT id, name, active FROM products WHERE (id, name) IN (${pairs});`);
out.push("");
out.push("-- ===== 2. Productos de ejemplo (mismo id y mismo nombre). Sus fotos se borran en cascada =====");
out.push(`DELETE FROM products WHERE (id, name) IN (${pairs});`);
out.push("");
out.push("-- ===== 3. Mismo id pero nombre distinto: pudo ser editado a mano → se deja INACTIVO para revisar =====");
out.push(`UPDATE products SET active = 0 WHERE id IN (${demo.products.map((p) => q(p.id)).join(", ")});`);
out.push("");
out.push("-- ===== 4. Subcategorías de ejemplo de Cocción (reemplazadas por las del lote real) =====");
out.push("-- Los productos que las usaran quedan sin subcategoría (ON DELETE SET NULL), no se borran.");
out.push("DELETE s FROM subcategories s JOIN categories c ON c.id = s.category_id WHERE c.slug = 'coccion' AND s.slug IN ('cocinas', 'anafes');");
out.push("");
out.push("-- ===== 5. A CONFIRMAR: subcategorías inventadas que quedan (Freezer) para la demo (no se borran solas) =====");
out.push("-- Si no las vas a usar, descomentá las líneas para borrarlas:");
for (const c of demo.categories) {
  // Cocción: se borra arriba. Termotanques: el lote real reusa "a-gas" y "electricos".
  // Aires, Calefacción, Lavarropas y Repuestos: se conservan como estructura (decidido). Heladeras: ver sql/ajustar-heladeras.sql.
  if (["coccion", "termotanques", "aires-acondicionados", "calefaccion", "lavarropas", "repuestos", "heladeras"].includes(c.slug)) continue;
  for (const s of c.subcategories) {
    out.push(`-- DELETE s FROM subcategories s JOIN categories c ON c.id = s.category_id WHERE c.slug = ${q(c.slug)} AND s.slug = ${q(s.slug)}; -- ${c.name} › ${s.name}`);
  }
}
out.push("");
fs.writeFileSync(path.join(__dirname, "limpiar-datos-demo.sql"), out.join("\n"));
console.log("Listo: sql/limpiar-datos-demo.sql (" + demo.products.length + " productos de ejemplo)");
