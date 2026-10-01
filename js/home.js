/* Refrigeración Are-Cold — Inicio: hero, categorías y marcas */

document.addEventListener("DOMContentLoaded", () => {
  renderHeroCopy();
  renderHeroFocus();
  renderCategoryShowcase();
  renderBrands();
});

/* Foto del local de fondo: la cargada en el panel, o la fachada original (assets/fachada-local.jpg).
   "fachada-placeholder.jpg" era el nombre de la foto de referencia anterior: si la base todavía lo
   tiene guardado, se muestra la foto real. */
const HERO_DEFAULT = "assets/fachada-local.jpg";

function renderHeroBackground() {
  const img = document.querySelector("#hero-bg");
  if (!img) return;
  const saved = settings().heroImage;
  img.src = assetURL(!saved || saved === "assets/fachada-placeholder.jpg" ? HERO_DEFAULT : saved);
}

/* Textos del hero: editables desde el panel (Datos del negocio → Textos del inicio) */
function renderHeroCopy() {
  const s = settings();
  const title = document.querySelector("#hero-title");
  if (title && s.heroTitle) {
    title.innerHTML = `${escapeHTML(s.heroTitle)}${s.heroHighlight ? ` <em>${escapeHTML(s.heroHighlight)}</em>` : ""}`;
  }
  const eyebrow = document.querySelector("#hero-eyebrow");
  if (eyebrow && s.heroEyebrow) eyebrow.textContent = s.heroEyebrow;
  const text = document.querySelector("#hero-text");
  if (text && s.heroText) text.textContent = s.heroText;
}

/* Las dos categorías marcadas como "destacadas" (hoy Calefacción y Aires).
   Calefacción va en tono cálido; el resto en frío, con el borde de hielo del logo. */
function renderHeroFocus() {
  const holder = document.querySelector("#hero-focus");
  if (!holder) return;
  const focus = AECOLD_DATA.categories.filter((c) => c.highlight).slice(0, 2);
  if (!focus.length) {
    holder.remove();
    return;
  }

  holder.innerHTML = focus
    .map((c) => {
      const warm = c.slug === "calefaccion";
      const n = countIn(c.slug);
      const subs = c.subcategories
        .map((sub) => `<a href="catalogo.html?cat=${c.slug}&sub=${sub.slug}">${escapeHTML(sub.name)}</a>`)
        .join("");
      return `
      <article class="focus-card focus-card--${warm ? "warm" : "cold"}">
        ${c.image ? `<img class="focus-card__img" src="${assetURL(c.image)}" alt="">` : ""}
        ${warm ? "" : '<svg class="frost-edge" viewBox="0 0 400 34" preserveAspectRatio="none" aria-hidden="true"><use href="#icon-frost-strip"></use></svg>'}
        <div class="focus-card__body">
          <span class="focus-card__icon">${iconHTML(warm ? "flame" : c.icon)}</span>
          <h2><a class="focus-card__link" href="catalogo.html?cat=${c.slug}">${escapeHTML(c.name)}</a></h2>
          <p class="focus-card__meta">${n} ${n === 1 ? "equipo" : "equipos"} en catálogo</p>
          ${subs ? `<div class="focus-card__subs">${subs}</div>` : ""}
          <span class="focus-card__cta" aria-hidden="true">Ver equipos ${iconHTML("arrow-right")}</span>
        </div>
      </article>`;
    })
    .join("");
  holder.classList.toggle("hero-focus--single", focus.length === 1);
}

/* Grilla grande de categorías con foto. Heladeras y Repuestos ocupan dos columnas */
function renderCategoryShowcase() {
  const grid = document.querySelector("#category-showcase");
  if (!grid) return;
  const wide = new Set(["heladeras", "repuestos"]);

  grid.innerHTML = AECOLD_DATA.categories
    .map((c) => {
      const n = countIn(c.slug);
      const subs = c.subcategories.slice(0, 3).map((s) => escapeHTML(s.name)).join(" · ");
      const classes = ["cat-card"];
      if (wide.has(c.slug)) classes.push("cat-card--wide");
      if (!c.image) classes.push("cat-card--plain");
      return `
      <a class="${classes.join(" ")}" href="catalogo.html?cat=${c.slug}">
        ${c.image ? `<img src="${assetURL(c.image)}" alt="" loading="lazy">` : ""}
        <span class="cat-card__icon">${iconHTML(c.icon)}</span>
        <span class="cat-card__text">
          <strong>${escapeHTML(c.name)}</strong>
          <small>${subs || `${n} ${n === 1 ? "producto" : "productos"}`}</small>
        </span>
        <span class="cat-card__arrow">${iconHTML("arrow-right")}</span>
      </a>`;
    })
    .join("");
}

/* Tira de marcas: solo logos reales cargados en el panel. La lista se duplica para que la animación sea continua */
function renderBrands() {
  const track = document.querySelector("#brands-track");
  if (!track) return;
  const brands = (settings().brands || []).filter((b) => b && typeof b === "object" && b.logo);
  if (!brands.length) {
    track.closest("section")?.remove();
    return;
  }
  const item = (b, hidden) =>
    `<li class="brand-logo"${hidden ? ' aria-hidden="true"' : ""}><img src="${escapeHTML(b.logo)}" alt="${hidden ? "" : escapeHTML(b.name || "")}" loading="lazy" decoding="async"></li>`;
  // Con pocas marcas se repite la tanda hasta que la tira supere el ancho de pantalla
  const reps = Math.max(1, Math.ceil(8 / brands.length));
  const set = Array.from({ length: reps }, () => brands).flat();
  track.innerHTML = set.map((b, i) => item(b, i >= brands.length)).join("") + set.map((b) => item(b, true)).join("");
  track.style.setProperty("--brands-duration", `${Math.max(set.length * 3.5, 18)}s`);
}

// La foto de fondo se asigna apenas carga el script (los scripts van al final del <body>),
// sin esperar a DOMContentLoaded. Va al final porque usa HERO_DEFAULT, definida arriba.
renderHeroBackground();
