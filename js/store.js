/* Refrigeración Are-Cold — capa de datos compartida (sitio público + panel)

   Los datos vienen del servidor: cada página carga <script src="api/data.php?format=js">
   antes que este archivo, y ese script define window.AECOLD_SERVER con las categorías,
   los productos visibles y los datos del negocio. El panel los pide a api/admin.php
   (incluye los dados de baja) y los guarda ahí mismo; nada del catálogo vive en el navegador.
   Lo único que se guarda en el navegador es la lista "Mi cotización" de cada visitante. */

const QUOTE_KEY = "arecold:quote";

/* FALLBACK DE EJEMPLO: si no hay datos del servidor, se usan los de data/datos-de-ejemplo.js
   (window.AECOLD_DEMO). Pasa si se abre el sitio sin PHP o si api/data.php no pudo conectar con la
   base (en ese caso el servidor ya manda los de ejemplo con demo: true). layout.js muestra un aviso. */
const AECOLD_DATA = window.AECOLD_SERVER || (window.AECOLD_DEMO && { ...window.AECOLD_DEMO, demo: true }) || { settings: {}, categories: [], products: [] };
AECOLD_DATA.settings = AECOLD_DATA.settings || {};
AECOLD_DATA.products = (AECOLD_DATA.products || []).filter((p) => p.active !== false);

/* ---------- Helpers de lectura ---------- */

function settings() {
  return AECOLD_DATA.settings;
}

function getCategory(slug) {
  return AECOLD_DATA.categories.find((c) => c.slug === slug);
}

function getSubcategory(catSlug, subSlug) {
  return getCategory(catSlug)?.subcategories.find((s) => s.slug === subSlug);
}

function categoryName(slug) {
  return getCategory(slug)?.name || slug;
}

function subcategoryName(catSlug, subSlug) {
  return getSubcategory(catSlug, subSlug)?.name || "";
}

function categoryIcon(slug) {
  return getCategory(slug)?.icon || "tag";
}

/* Solo lo que se muestra en el sitio público (los dados de baja quedan ocultos) */
function activeProducts() {
  return AECOLD_DATA.products.filter((p) => p.active !== false);
}

function findProduct(id) {
  return AECOLD_DATA.products.find((p) => p.id === id);
}

function countIn(catSlug, subSlug) {
  return activeProducts().filter(
    (p) => p.category === catSlug && (!subSlug || p.subcategory === subSlug)
  ).length;
}

/* Las rutas de imágenes se guardan relativas a la raíz del sitio.
   El panel vive en /admin, así que define AECOLD_ASSET_BASE = "../" antes de cargar este archivo. */
function assetURL(src) {
  if (!src) return "";
  if (/^(data:|blob:|https?:)/.test(src)) return src;
  return (window.AECOLD_ASSET_BASE || "") + src;
}

/* Fotos de banco de imágenes de los productos de ejemplo: llevan la etiqueta "Imagen ilustrativa" */
function isStockPhoto(src) {
  return typeof src === "string" && src.startsWith("assets/productos/");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

/* ---------- WhatsApp ---------- */

function waLink(message) {
  const base = `https://wa.me/${settings().whatsapp || ""}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

function waLinkForProduct(name) {
  return waLink(`Hola! Quería consultar por ${name}. ¿Tienen disponibilidad y cuál es el precio?`);
}

function mapsLink() {
  const s = settings();
  const q = [s.address, s.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/* ---------- Carrito de cotización (solo ids, en el navegador) ---------- */

function getQuote() {
  try {
    const ids = JSON.parse(localStorage.getItem(QUOTE_KEY)) || [];
    // Si un producto se dio de baja o se borró, deja de contar
    return ids.filter((id) => {
      const p = findProduct(id);
      return p && p.active !== false;
    });
  } catch (e) {
    return [];
  }
}

function setQuote(ids) {
  try { localStorage.setItem(QUOTE_KEY, JSON.stringify(ids)); } catch (e) {}
  document.dispatchEvent(new CustomEvent("quote:change", { detail: { ids } }));
}

function isInQuote(id) {
  return getQuote().includes(id);
}

function addToQuote(id) {
  const ids = getQuote();
  if (!ids.includes(id)) setQuote([...ids, id]);
}

function removeFromQuote(id) {
  setQuote(getQuote().filter((x) => x !== id));
}

function clearQuote() {
  setQuote([]);
}

function quoteMessage(ids) {
  const lines = ids
    .map(findProduct)
    .filter(Boolean)
    .map((p) => `- ${p.name}`);
  return `Hola! Quería pedir una cotización de estos productos:\n${lines.join("\n")}\n\n¿Me pasan precio y disponibilidad?`;
}

// Otra pestaña cambió la cotización: avisamos a esta
window.addEventListener("storage", (e) => {
  if (e.key === QUOTE_KEY) {
    document.dispatchEvent(new CustomEvent("quote:change", { detail: { ids: getQuote() } }));
  }
});
