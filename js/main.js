/* Refrigeración Are-Cold — comportamiento compartido entre páginas.
   Los datos (productos, categorías, WhatsApp, etc.) vienen de js/store.js. */

document.addEventListener("DOMContentLoaded", () => {
  wireWhatsappLinks();
  wireMobileNav();
  wireSearchPanel();
  wireMegaMenu();
  wireRevealOnScroll();
  wireProductModal();
  wireQuote();
  markCurrentNav();
});

const iconHTML = (id, cls = "icon") => `<svg class="${cls}" aria-hidden="true"><use href="#icon-${id}"></use></svg>`;

/* Completa automáticamente todos los enlaces genéricos de WhatsApp */
function wireWhatsappLinks(root = document) {
  root.querySelectorAll("[data-wa]").forEach((el) => {
    const msg = el.getAttribute("data-wa") || "";
    el.setAttribute("href", waLink(msg || "Hola! Quería hacer una consulta."));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });
}

function markCurrentNav() {
  // Con URLs limpias la ruta es "/catalogo" o "/inicio"; abierto como archivo, "catalogo.html"
  let path = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
  if (path === "inicio") path = "index";
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    if (link.getAttribute("href").replace(/\.html$/, "") === path) link.setAttribute("aria-current", "page");
  });
}

function wireMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".mobile-nav");
  const closeBtn = document.querySelector(".mobile-nav__close");
  if (!toggle || !nav) return;

  const open = () => {
    nav.classList.add("is-open");
    nav.setAttribute("aria-hidden", "false");
    document.body.classList.add("nav-locked");
    toggle.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    nav.classList.remove("is-open");
    nav.setAttribute("aria-hidden", "true");
    document.body.classList.remove("nav-locked");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  nav.querySelectorAll("a, [data-quote-open]").forEach((a) => a.addEventListener("click", close));
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

/* Mega-menú: se abre al pasar el mouse por "Categorías" (o al tocar, en pantallas táctiles).
   Pasar por una categoría muestra sus subcategorías a la derecha. */
function wireMegaMenu() {
  const trigger = document.querySelector(".nav-cats");
  const mega = document.querySelector("#mega-menu");
  if (!trigger || !mega) return;

  const header = document.querySelector(".site-header");
  const canHover = window.matchMedia("(hover: hover)").matches;
  let closeTimer;

  const open = () => {
    clearTimeout(closeTimer);
    mega.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    mega.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  };
  const closeSoon = () => {
    closeTimer = setTimeout(close, 180);
  };

  trigger.addEventListener("click", () => (mega.classList.contains("is-open") ? close() : open()));

  if (canHover) {
    trigger.addEventListener("mouseenter", open);
    trigger.addEventListener("mouseleave", closeSoon);
    mega.addEventListener("mouseenter", open);
    mega.addEventListener("mouseleave", closeSoon);
  }

  const showPanel = (slug) => {
    mega.querySelectorAll("[data-mega-cat]").forEach((a) => {
      if (a.dataset.megaCat === slug) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    mega.querySelectorAll("[data-mega-panel]").forEach((p) => {
      p.hidden = p.dataset.megaPanel !== slug;
    });
  };

  mega.querySelectorAll("[data-mega-cat]").forEach((a) => {
    a.addEventListener("mouseenter", () => showPanel(a.dataset.megaCat));
    a.addEventListener("focus", () => {
      open();
      showPanel(a.dataset.megaCat);
    });
  });

  document.addEventListener("click", (e) => {
    if (!header.contains(e.target)) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mega.classList.contains("is-open")) {
      close();
      trigger.focus();
    }
  });
  mega.addEventListener("focusout", (e) => {
    if (!mega.contains(e.relatedTarget) && e.relatedTarget !== trigger) close();
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
   Tarjetas y fotos de producto
   ========================================================= */
function tagLabel(tag) {
  if (tag === "oferta") return "Oferta";
  if (tag === "destacado") return "Destacado";
  if (tag === "nuevo") return "Nuevo";
  return "";
}

function tagBadgeHTML(tag) {
  if (!tag) return "";
  const icon = tag === "oferta" ? "tag" : tag === "destacado" ? "star" : "check";
  return `<span class="badge badge--${tag}">${iconHTML(icon, "badge__icon")}${tagLabel(tag)}</span>`;
}

function productCategoryLabel(product) {
  const sub = subcategoryName(product.category, product.subcategory);
  return escapeHTML(sub ? `${categoryName(product.category)} · ${sub}` : categoryName(product.category));
}

/* La tarjeta usa solo la primera foto del array */
function photoBlockHTML(product) {
  const first = (product.images || [])[0];
  if (first) {
    return `
      <div class="photo-block photo-block--photo">
        ${tagBadgeHTML(product.tag)}
        <img src="${escapeHTML(assetURL(first))}" alt="" loading="lazy">
        ${isStockPhoto(first) ? '<span class="photo-block__tag">Imagen ilustrativa</span>' : ""}
      </div>`;
  }
  return `
    <div class="photo-block">
      ${tagBadgeHTML(product.tag)}
      ${iconHTML(categoryIcon(product.category))}
      <span class="photo-block__tag">Foto del producto</span>
    </div>`;
}

function quoteButtonHTML(product, extraClass = "") {
  const inQuote = isInQuote(product.id);
  return `
    <button type="button" class="btn btn--quote ${extraClass}${inQuote ? " is-added" : ""}" data-quote-toggle="${product.id}" aria-pressed="${inQuote}">
      ${iconHTML(inQuote ? "check" : "plus")}
      <span>${inQuote ? "En tu cotización" : "Agregar a cotización"}</span>
    </button>`;
}

/* Precio en pesos argentinos; sin precio cargado, se invita a consultar */
function priceHTML(product, extraClass = "") {
  const n = Number(product.price);
  const text = n > 0 ? "$ " + n.toLocaleString("es-AR") : "";
  return text
    ? `<p class="price ${extraClass}">${text}</p>`
    : `<p class="price price--ask ${extraClass}">Consultar precio</p>`;
}

function productCardHTML(product) {
  return `
    <article class="product-card">
      <button type="button" class="product-card__open" data-product-id="${product.id}" aria-haspopup="dialog">
        <div class="product-card__media">${photoBlockHTML(product)}</div>
        <div class="product-card__body">
          <span class="product-card__cat">${productCategoryLabel(product)}</span>
          <h3 class="product-card__name">${escapeHTML(product.name)}</h3>
          ${priceHTML(product)}
        </div>
      </button>
      <div class="product-card__foot">
        ${quoteButtonHTML(product, "btn--sm btn--block")}
      </div>
    </article>`;
}

/* =========================================================
   Modal de ficha de producto con galería
   ========================================================= */
function wireProductModal() {
  const overlay = document.querySelector("#product-modal");
  if (!overlay) return;

  const closeBtn = overlay.querySelector(".product-modal__close");
  const body = overlay.querySelector(".product-modal__content");
  let lastFocus = null;

  function openModalFor(product) {
    lastFocus = document.activeElement;
    body.innerHTML = renderModalContent(product);
    wireGallery(body.querySelector("[data-gallery]"), product);
    overlay.classList.add("is-open");
    document.body.classList.add("nav-locked");
    closeBtn.focus();
  }

  function closeModal() {
    if (!overlay.classList.contains("is-open")) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("nav-locked");
    lastFocus?.focus();
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-product-id]");
    if (!trigger) return;
    e.preventDefault();
    const product = findProduct(trigger.dataset.productId);
    if (product) openModalFor(product);
  });

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if (!overlay.classList.contains("is-open") || !activeGalleryStep) return;
    if (e.key === "ArrowRight") activeGalleryStep(1);
    if (e.key === "ArrowLeft") activeGalleryStep(-1);
  });

  window.openProductModal = (id) => {
    const product = findProduct(id);
    if (product && product.active !== false) openModalFor(product);
  };
}

function galleryHTML(product) {
  const images = product.images || [];
  if (!images.length) {
    return `<div class="gallery" data-gallery><div class="gallery__stage">${photoBlockHTML(product)}</div></div>`;
  }
  const many = images.length > 1;
  const thumbs = many
    ? `<div class="gallery__thumbs" role="group" aria-label="Fotos del producto">
        ${images
          .map(
            (src, i) => `
          <button type="button" class="gallery__thumb" data-gallery-go="${i}" aria-label="Ver foto ${i + 1} de ${images.length}"${i === 0 ? ' aria-current="true"' : ""}>
            <img src="${escapeHTML(assetURL(src))}" alt="" loading="lazy">
          </button>`
          )
          .join("")}
      </div>`
    : "";
  return `
    <div class="gallery" data-gallery>
      <div class="gallery__stage">
        ${tagBadgeHTML(product.tag)}
        <img class="gallery__main" src="${escapeHTML(assetURL(images[0]))}" alt="${escapeHTML(product.name)}">
        <span class="photo-block__tag" data-gallery-stock${isStockPhoto(images[0]) ? "" : " hidden"}>Imagen ilustrativa</span>
        ${
          many
            ? `<button type="button" class="gallery__nav gallery__nav--prev" data-gallery-step="-1" aria-label="Foto anterior">${iconHTML("arrow-left")}</button>
               <button type="button" class="gallery__nav gallery__nav--next" data-gallery-step="1" aria-label="Foto siguiente">${iconHTML("arrow-right")}</button>
               <span class="gallery__count" data-gallery-count>1 / ${images.length}</span>`
            : ""
        }
      </div>
      ${thumbs}
    </div>`;
}

let activeGalleryStep = null;

function wireGallery(root, product) {
  const images = product.images || [];
  activeGalleryStep = null;
  if (!root || images.length < 2) return;
  const main = root.querySelector(".gallery__main");
  const count = root.querySelector("[data-gallery-count]");
  const stock = root.querySelector("[data-gallery-stock]");
  let index = 0;

  const go = (i) => {
    index = (i + images.length) % images.length;
    main.src = assetURL(images[index]);
    count.textContent = `${index + 1} / ${images.length}`;
    stock.hidden = !isStockPhoto(images[index]);
    root.querySelectorAll("[data-gallery-go]").forEach((t, n) => {
      if (n === index) t.setAttribute("aria-current", "true");
      else t.removeAttribute("aria-current");
    });
  };

  root.addEventListener("click", (e) => {
    const step = e.target.closest("[data-gallery-step]");
    const jump = e.target.closest("[data-gallery-go]");
    if (step) go(index + Number(step.dataset.galleryStep));
    if (jump) go(Number(jump.dataset.galleryGo));
  });
  activeGalleryStep = (n) => go(index + n);

  // Deslizar con el dedo en celular
  let startX = null;
  main.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
  main.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
}

function renderModalContent(product) {
  const featuresHTML = (product.features || [])
    .map((f) => `<li>${iconHTML("check")}<span>${escapeHTML(f)}</span></li>`)
    .join("");

  return `
    <div class="product-modal__media">${galleryHTML(product)}</div>
    <div class="product-modal__body">
      <span class="product-modal__cat">${productCategoryLabel(product)}</span>
      <h2 id="product-modal-title">${escapeHTML(product.name)}</h2>
      ${priceHTML(product, "price--lg")}
      ${product.description ? `<p class="product-modal__desc">${escapeHTML(product.description)}</p>` : ""}
      ${featuresHTML ? `<ul class="product-modal__features">${featuresHTML}</ul>` : ""}
      <div class="product-modal__actions">
        ${quoteButtonHTML(product)}
        <a class="btn btn--ghost-dark" href="${waLinkForProduct(product.name)}" target="_blank" rel="noopener">
          ${iconHTML("whatsapp")}
          Consultar solo este
        </a>
      </div>
    </div>`;
}

/* =========================================================
   Mi cotización: botón con contador, panel lateral y mensaje de WhatsApp
   ========================================================= */
function wireQuote() {
  const overlay = document.querySelector("[data-quote-overlay]");
  if (!overlay) return;
  const list = overlay.querySelector("[data-quote-list]");
  const foot = overlay.querySelector("[data-quote-foot]");
  const summary = overlay.querySelector("[data-quote-summary]");
  const send = overlay.querySelector("[data-quote-send]");
  let lastFocus = null;

  const open = () => {
    lastFocus = document.activeElement;
    document.querySelector(".toast")?.classList.remove("is-visible");
    renderDrawer();
    overlay.classList.add("is-open");
    document.body.classList.add("nav-locked");
    overlay.querySelector("[data-quote-close]").focus();
  };
  const close = () => {
    if (!overlay.classList.contains("is-open")) return;
    overlay.classList.remove("is-open");
    if (!document.querySelector(".modal-overlay.is-open")) document.body.classList.remove("nav-locked");
    lastFocus?.focus();
  };

  function renderDrawer() {
    const ids = getQuote();
    const n = ids.length;
    summary.textContent = n
      ? `${n} ${n === 1 ? "producto elegido" : "productos elegidos"}`
      : "Todavía no elegiste productos";
    foot.hidden = !n;

    if (!n) {
      list.innerHTML = `
        <div class="quote-empty">
          ${iconHTML("clipboard")}
          <h3>Tu lista está vacía</h3>
          <p>Recorré el catálogo y tocá “Agregar a cotización” en los productos que te interesen. Después nos mandás todo junto por WhatsApp.</p>
          <a class="btn btn--primary" href="catalogo.html">Ver catálogo</a>
        </div>`;
      return;
    }

    list.innerHTML = `<ul class="quote-items">${ids
      .map(findProduct)
      .map((p) => {
        const img = (p.images || [])[0];
        return `
        <li class="quote-item">
          <div class="quote-item__thumb">${
            img ? `<img src="${escapeHTML(assetURL(img))}" alt="">` : iconHTML(categoryIcon(p.category))
          }</div>
          <div class="quote-item__info">
            <strong>${escapeHTML(p.name)}</strong>
            <span>${productCategoryLabel(p)}</span>
          </div>
          <button type="button" class="icon-btn quote-item__remove" data-quote-remove="${p.id}" aria-label="Quitar ${escapeHTML(p.name)}">
            ${iconHTML("trash")}
          </button>
        </li>`;
      })
      .join("")}</ul>`;
    send.href = waLink(quoteMessage(ids));
  }

  function syncCounters() {
    const n = getQuote().length;
    document.querySelectorAll("[data-quote-count]").forEach((el) => {
      el.textContent = n;
      el.hidden = n === 0;
    });
    document.querySelectorAll(".quote-btn[data-quote-open]").forEach((btn) => {
      btn.setAttribute("aria-label", `Mi cotización, ${n} ${n === 1 ? "producto" : "productos"}`);
    });
  }

  function syncToggleButtons() {
    const ids = getQuote();
    document.querySelectorAll("[data-quote-toggle]").forEach((btn) => {
      const added = ids.includes(btn.dataset.quoteToggle);
      btn.classList.toggle("is-added", added);
      btn.setAttribute("aria-pressed", String(added));
      btn.querySelector("use")?.setAttribute("href", `#icon-${added ? "check" : "plus"}`);
      const label = btn.querySelector("span");
      if (label) label.textContent = added ? "En tu cotización" : "Agregar a cotización";
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-quote-open]")) {
      e.preventDefault();
      open();
      return;
    }
    const toggle = e.target.closest("[data-quote-toggle]");
    if (toggle) {
      const id = toggle.dataset.quoteToggle;
      if (isInQuote(id)) {
        removeFromQuote(id);
        showToast("Lo quitamos de tu cotización");
      } else {
        addToQuote(id);
        showToast("Agregado a tu cotización", true);
      }
      return;
    }
    const remove = e.target.closest("[data-quote-remove]");
    if (remove) removeFromQuote(remove.dataset.quoteRemove);
    if (e.target.closest("[data-quote-clear]")) clearQuote();
    if (e.target.closest("[data-quote-close]") || e.target === overlay) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  document.addEventListener("quote:change", () => {
    syncCounters();
    syncToggleButtons();
    if (overlay.classList.contains("is-open")) renderDrawer();
  });

  syncCounters();
}

let toastTimer;
function showToast(message, withLink = false) {
  const toast = document.querySelector(".toast");
  if (!toast) return;
  toast.innerHTML = `${iconHTML("check")}<span>${escapeHTML(message)}</span>${
    withLink ? '<button type="button" data-quote-open>Ver lista</button>' : ""
  }`;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

/* Medición de consultas: si el sitio tiene Google Analytics (gtag) o Plausible, cada clic a WhatsApp queda registrado */
document.addEventListener("click", (e) => {
  const link = e.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"], a[data-wa], a[data-quote-send]');
  if (!link) return;
  try {
    if (typeof window.gtag === "function") window.gtag("event", "whatsapp_click", { link_text: (link.textContent || "").trim().slice(0, 60) });
    if (typeof window.plausible === "function") window.plausible("WhatsApp");
  } catch (err) { /* la medición nunca debe romper el sitio */ }
});
