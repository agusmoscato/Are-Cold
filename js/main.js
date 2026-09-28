/* Refrigeración Are-Cold — comportamiento compartido entre páginas */

const WHATSAPP_NUMBER = "5492326422390";

function waLink(message) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

function waLinkForProduct(name) {
  return waLink(`Hola! Quería consultar por ${name}. ¿Tienen disponibilidad y cuál es el precio?`);
}

document.addEventListener("DOMContentLoaded", () => {
  wireWhatsappLinks();
  wireMobileNav();
  wireSearchPanel();
  wireRevealOnScroll();
  wireProductModal();
  markCurrentNav();
});

/* Completa automáticamente todos los enlaces genéricos de WhatsApp */
function wireWhatsappLinks() {
  document.querySelectorAll("[data-wa]").forEach((el) => {
    const msg = el.getAttribute("data-wa") || "";
    el.setAttribute("href", waLink(msg || "Hola! Quería hacer una consulta."));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });
}

function markCurrentNav() {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === path) link.setAttribute("aria-current", "page");
  });
}

function wireMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".mobile-nav");
  const closeBtn = document.querySelector(".mobile-nav__close");
  if (!toggle || !nav) return;

  const open = () => {
    nav.classList.add("is-open");
    document.body.classList.add("nav-locked");
    toggle.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-locked");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

function wireSearchPanel() {
  const toggle = document.querySelector(".search-toggle");
  const panel = document.querySelector(".search-panel");
  if (!toggle || !panel) return;

  const input = panel.querySelector("input");

  toggle.addEventListener("click", () => {
    const isOpen = panel.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) input?.focus();
  });

  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && !toggle.contains(e.target)) {
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  panel.querySelector("form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input?.value.trim();
    if (!q) return;
    window.location.href = `catalogo.html?q=${encodeURIComponent(q)}`;
  });
}

function wireRevealOnScroll() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  els.forEach((el) => io.observe(el));
}

/* =========================================================
   Modal de ficha de producto, reutilizado en Inicio y Catálogo
   ========================================================= */
function wireProductModal() {
  const overlay = document.querySelector("#product-modal");
  if (!overlay) return;

  const closeBtn = overlay.querySelector(".product-modal__close");
  const body = overlay.querySelector(".product-modal__content");

  function openModalFor(product) {
    body.innerHTML = renderModalContent(product);
    overlay.classList.add("is-open");
    document.body.classList.add("nav-locked");
    closeBtn.focus();
  }

  function closeModal() {
    overlay.classList.remove("is-open");
    document.body.classList.remove("nav-locked");
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-product-id]");
    if (!trigger) return;
    e.preventDefault();
    const product = AECOLD_DATA.products.find((p) => p.id === trigger.dataset.productId);
    if (product) openModalFor(product);
  });

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

function categoryName(slug) {
  return AECOLD_DATA.categories.find((c) => c.slug === slug)?.name || slug;
}

function categoryIcon(slug) {
  return AECOLD_DATA.categories.find((c) => c.slug === slug)?.icon || "tag";
}

/* Fotos de stock genéricas por categoría (no son fotos reales del producto/stock del cliente,
   ver DECISIONES-DISENO.md). Si una categoría no tiene foto acá, se usa el bloque con ícono. */
const CATEGORY_PHOTOS = {
  "heladeras": "assets/productos/heladeras.jpg",
  "freezer": "assets/productos/freezer.jpg",
  "lavarropas": "assets/productos/lavarropas.jpg",
  "secadoras": "assets/productos/secadoras.jpg",
  "lavavajillas": "assets/productos/lavavajillas.jpg",
  "coccion": "assets/productos/coccion.jpg",
  "campanas": "assets/productos/campanas.jpg",
  "aires-acondicionados": "assets/productos/aires-acondicionados.jpg",
  "calefaccion": "assets/productos/calefaccion.jpg",
  "termotanques": "assets/productos/termotanques.jpg",
  "smart-tv": "assets/productos/smart-tv.jpg",
  "colchones": "assets/productos/colchones.jpg",
  "pequenos-electrodomesticos": "assets/productos/pequenos-electrodomesticos.jpg",
  "repuestos": "assets/productos/repuestos.jpg"
};

function tagLabel(tag) {
  if (tag === "oferta") return "Oferta";
  if (tag === "destacado") return "Destacado";
  if (tag === "nuevo") return "Nuevo";
  return "";
}

function tagBadgeHTML(tag) {
  if (!tag) return "";
  const label = tagLabel(tag);
  const icon = tag === "oferta" ? "tag" : tag === "destacado" ? "star" : "check";
  return `<span class="badge badge--${tag}"><svg class="badge__icon" aria-hidden="true"><use href="#icon-${icon}"></use></svg>${label}</span>`;
}

function photoBlockHTML(categorySlug, tag) {
  const photo = CATEGORY_PHOTOS[categorySlug];
  if (photo) {
    return `
      <div class="photo-block photo-block--photo">
        ${tagBadgeHTML(tag)}
        <img src="${photo}" alt="" loading="lazy">
        <span class="photo-block__tag">Imagen ilustrativa</span>
      </div>
    `;
  }
  return `
    <div class="photo-block">
      ${tagBadgeHTML(tag)}
      <svg class="icon" aria-hidden="true"><use href="#icon-${categoryIcon(categorySlug)}"></use></svg>
      <span class="photo-block__tag">Foto del producto</span>
    </div>
  `;
}

function productCardHTML(product) {
  return `
    <article class="product-card reveal is-visible">
      <button type="button" class="product-card__open" data-product-id="${product.id}" aria-haspopup="dialog">
        <div class="product-card__media">${photoBlockHTML(product.category, product.tag)}</div>
        <div class="product-card__body">
          <span class="product-card__cat">${categoryName(product.category)}</span>
          <h3 class="product-card__name">${product.name}</h3>
        </div>
      </button>
      <div class="product-card__body" style="padding-top:0">
        <a class="btn btn--whatsapp btn--sm btn--block" href="${waLinkForProduct(product.name)}" target="_blank" rel="noopener">
          <svg class="icon" aria-hidden="true"><use href="#icon-whatsapp"></use></svg>
          Consultar
        </a>
      </div>
    </article>
  `;
}

function renderModalContent(product) {
  const featuresHTML = product.features
    .map(
      (f) => `<li><svg class="icon" aria-hidden="true"><use href="#icon-check"></use></svg><span>${f}</span></li>`
    )
    .join("");

  return `
    <div class="product-modal__media">${photoBlockHTML(product.category, product.tag)}</div>
    <div class="product-modal__body">
      <span class="product-modal__cat">${categoryName(product.category)}</span>
      <h2 id="product-modal-title">${product.name}</h2>
      <p class="product-modal__desc">${product.description}</p>
      <ul class="product-modal__features">${featuresHTML}</ul>
      <div class="product-modal__actions">
        <a class="btn btn--whatsapp" href="${waLinkForProduct(product.name)}" target="_blank" rel="noopener">
          <svg class="icon" aria-hidden="true"><use href="#icon-whatsapp"></use></svg>
          Consultar por WhatsApp
        </a>
      </div>
    </div>
  `;
}
