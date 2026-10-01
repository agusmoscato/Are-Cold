/* Refrigeración Are-Cold — partes compartidas entre páginas.
   Header (con mega-menú de categorías), menú móvil, footer, botón flotante,
   panel "Mi cotización" y modal de producto se arman acá a partir de los datos,
   así un cambio hecho en el panel se ve en todas las páginas.
   Cada página solo tiene <div id="site-header"></div> y <div id="site-footer"></div>. */

(function renderLayout() {
  const s = settings();
  const cats = AECOLD_DATA.categories;
  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#icon-${id}"></use></svg>`;
  const catURL = (cat, sub) => `catalogo.html?cat=${cat}${sub ? `&sub=${sub}` : ""}`;

  /* ---------- Header + mega-menú ---------- */
  const megaCats = cats
    .map(
      (c, i) => `
      <li>
        <a class="mega__cat" href="${catURL(c.slug)}" data-mega-cat="${c.slug}"${i === 0 ? ' aria-current="true"' : ""}>
          ${icon(c.icon)}<span>${escapeHTML(c.name)}</span>${c.subcategories.length ? icon("chevron") : ""}
        </a>
      </li>`
    )
    .join("");

  const megaPanels = cats
    .map((c, i) => {
      const subs = c.subcategories.length
        ? `<ul class="mega__subs">${c.subcategories
            .map(
              (sub) => `<li><a href="${catURL(c.slug, sub.slug)}">${escapeHTML(sub.name)}<small>${countIn(c.slug, sub.slug)}</small></a></li>`
            )
            .join("")}</ul>`
        : `<p class="mega__empty">Esta categoría no tiene subdivisiones. Mirá todos sus productos de una.</p>`;
      const photo = c.image
        ? `<img class="mega__photo" src="${assetURL(c.image)}" alt="" loading="lazy">`
        : `<div class="mega__photo mega__photo--icon">${icon(c.icon)}</div>`;
      return `
      <div class="mega__panel" data-mega-panel="${c.slug}"${i === 0 ? "" : " hidden"}>
        <div class="mega__panel-copy">
          <h3>${escapeHTML(c.name)}</h3>
          ${subs}
          <a class="mega__all" href="${catURL(c.slug)}">Ver todo en ${escapeHTML(c.name)} ${icon("arrow-right")}</a>
        </div>
        ${photo}
      </div>`;
    })
    .join("");

  // Aviso de datos de ejemplo (sin base conectada): para que nadie los confunda con el catálogo real
  const demoNotice = AECOLD_DATA.demo
    ? `<div class="demo-notice" role="note">Vista con <strong>datos de ejemplo</strong>: la base de datos todavía no está conectada.</div>`
    : "";

  const header = demoNotice + `
  <header class="site-header">
    <div class="container site-header__bar">
      <a href="index.html" class="site-header__logo" aria-label="Are-Cold, ir al inicio">
        <img src="assets/logo-arecold.png?v=2" alt="Are-Cold">
      </a>

      <nav class="site-header__nav" aria-label="Navegación principal">
        <a href="index.html" data-nav-link>Inicio</a>
        <button type="button" class="nav-cats" aria-expanded="false" aria-controls="mega-menu">
          Categorías ${icon("chevron-down")}
        </button>
        <a href="catalogo.html" data-nav-link>Catálogo</a>
        <a href="nosotros.html" data-nav-link>Nosotros</a>
        <a href="contacto.html" data-nav-link>Contacto</a>
      </nav>

      <div class="site-header__actions">
        <button type="button" class="icon-btn search-toggle" aria-expanded="false" aria-label="Buscar productos">
          ${icon("search")}
        </button>
        <button type="button" class="quote-btn" data-quote-open aria-label="Mi cotización, 0 productos">
          ${icon("clipboard")}
          <span class="quote-btn__label">Mi cotización</span>
          <span class="quote-count" data-quote-count hidden>0</span>
        </button>
        <a href="#" data-wa="Hola! Quería hacer una consulta." class="btn btn--whatsapp btn--sm header-whatsapp">
          ${icon("whatsapp")}
          WhatsApp
        </a>
        <button type="button" class="icon-btn nav-toggle" aria-expanded="false" aria-label="Abrir menú">
          ${icon("menu")}
        </button>
      </div>

      <div class="search-panel">
        <div class="container">
          <form role="search">
            <input type="search" placeholder="Buscar por producto, ej: split, estufa, heladera..." aria-label="Buscar productos">
            <button type="submit" class="btn btn--primary btn--sm">Buscar</button>
          </form>
        </div>
      </div>

      <div class="mega" id="mega-menu">
        <div class="container mega__inner">
          <ul class="mega__cats">${megaCats}</ul>
          <div class="mega__panels">${megaPanels}</div>
        </div>
      </div>
    </div>
  </header>`;

  /* ---------- Menú móvil: categorías como acordeón ---------- */
  const mobileCats = cats
    .map((c) => {
      if (!c.subcategories.length) {
        return `<li><a class="mobile-cat" href="${catURL(c.slug)}">${icon(c.icon)}${escapeHTML(c.name)}</a></li>`;
      }
      return `
      <li>
        <details class="mobile-cat-group">
          <summary class="mobile-cat">${icon(c.icon)}${escapeHTML(c.name)}${icon("chevron-down")}</summary>
          <div class="mobile-cat__subs">
            <a href="${catURL(c.slug)}">Ver todo</a>
            ${c.subcategories.map((sub) => `<a href="${catURL(c.slug, sub.slug)}">${escapeHTML(sub.name)}</a>`).join("")}
          </div>
        </details>
      </li>`;
    })
    .join("");

  const mobileNav = `
  <div class="mobile-nav" aria-hidden="true">
    <div class="mobile-nav__top">
      <img src="assets/logo-arecold.png?v=2" alt="Are-Cold">
      <button type="button" class="icon-btn mobile-nav__close" aria-label="Cerrar menú">${icon("close")}</button>
    </div>
    <nav class="mobile-nav__links" aria-label="Navegación móvil">
      <a href="index.html">Inicio</a>
      <details class="mobile-nav__cats">
        <summary>Categorías ${icon("chevron-down")}</summary>
        <ul>${mobileCats}</ul>
      </details>
      <a href="catalogo.html">Catálogo</a>
      <a href="nosotros.html">Nosotros</a>
      <a href="contacto.html">Contacto</a>
    </nav>
    <div class="mobile-nav__footer">
      <button type="button" class="btn btn--quote-outline btn--block" data-quote-open>
        ${icon("clipboard")} Mi cotización <span class="quote-count quote-count--inline" data-quote-count hidden>0</span>
      </button>
      <a href="#" data-wa="Hola! Quería hacer una consulta." class="btn btn--whatsapp btn--block">
        ${icon("whatsapp")} Escribinos por WhatsApp
      </a>
      <div class="mobile-nav__contact">${icon("pin")} <span data-setting="address">${escapeHTML(s.address)}</span></div>
    </div>
  </div>`;

  /* ---------- Footer ---------- */
  const footer = `
  <footer class="site-footer">
    <div class="container site-footer__top">
      <div class="site-footer__brand">
        <img src="assets/logo-arecold.png?v=2" alt="Are-Cold">
        <p>Electrodomésticos, climatización y repuestos. Armá tu selección en el catálogo y pedí la cotización por WhatsApp.</p>
        <div class="site-footer__social">
          <a href="#" data-href="instagram" target="_blank" rel="noopener" aria-label="Instagram">${icon("instagram")}</a>
          <a href="#" data-href="facebook" target="_blank" rel="noopener" aria-label="Facebook">${icon("facebook")}</a>
        </div>
      </div>
      <div>
        <h4>Navegación</h4>
        <div class="site-footer__list">
          <a href="index.html">Inicio</a>
          <a href="catalogo.html">Catálogo</a>
          <a href="nosotros.html">Nosotros</a>
          <a href="contacto.html">Contacto</a>
        </div>
      </div>
      <div>
        <h4>Más consultados</h4>
        <div class="site-footer__list">
          ${cats.filter((c) => c.highlight).map((c) => `<a href="${catURL(c.slug)}">${escapeHTML(c.name)}</a>`).join("")}
          <a href="${catURL("repuestos")}">Repuestos</a>
        </div>
      </div>
      <div>
        <h4>Contacto</h4>
        <div class="site-footer__list">
          <span data-setting="address"></span>
          <span data-setting="whatsappDisplay"></span>
          <a data-mail href="#"></a>
          <span data-setting="hoursShort"></span>
        </div>
      </div>
    </div>
    <div class="container site-footer__bottom">
      <span>© ${new Date().getFullYear()} Are-Cold</span>
      <span>Sitio desarrollado por <a href="https://moscode.com.ar" target="_blank" rel="noopener">Moscode</a></span>
    </div>
  </footer>

  <a href="#" data-wa="Hola! Quería hacer una consulta." class="float-whatsapp" aria-label="Escribinos por WhatsApp">${icon("whatsapp")}</a>

  <div class="quote-overlay" data-quote-overlay>
    <aside class="quote-drawer" role="dialog" aria-modal="true" aria-labelledby="quote-title">
      <div class="quote-drawer__head">
        <div>
          <h2 id="quote-title">Mi cotización</h2>
          <p data-quote-summary></p>
        </div>
        <button type="button" class="icon-btn" data-quote-close aria-label="Cerrar mi cotización">${icon("close")}</button>
      </div>
      <div class="quote-drawer__body" data-quote-list></div>
      <div class="quote-drawer__foot" data-quote-foot>
        <p class="quote-drawer__note">${icon("message")}<span>No hay pago online. Te respondemos por WhatsApp con precio y disponibilidad de todo junto.</span></p>
        <a class="btn btn--whatsapp btn--block" data-quote-send href="#" target="_blank" rel="noopener">
          ${icon("whatsapp")} Pedir cotización por WhatsApp
        </a>
        <button type="button" class="quote-drawer__clear" data-quote-clear>Vaciar lista</button>
      </div>
    </aside>
  </div>

  <div id="product-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
    <div class="product-modal">
      <button type="button" class="product-modal__close" aria-label="Cerrar ficha de producto">${icon("close")}</button>
      <div class="product-modal__content"></div>
    </div>
  </div>

  <div class="toast" role="status" aria-live="polite"></div>`;

  document.getElementById("site-header")?.insertAdjacentHTML("afterend", header + mobileNav);
  document.getElementById("site-header")?.remove();
  document.getElementById("site-footer")?.insertAdjacentHTML("afterend", footer);
  document.getElementById("site-footer")?.remove();

  bindSettings();
})();

/* Completa los datos del negocio en cualquier elemento marcado:
   data-setting="address"   → texto
   data-setting-lines="hours" → un <p> por renglón
   data-href="instagram" | "facebook" | "maps" → link
   data-map-embed (en un iframe) → mapa de Google Maps cargado en el panel */
function bindSettings(root = document) {
  const s = settings();
  root.querySelectorAll("[data-setting]").forEach((el) => {
    const value = s[el.dataset.setting];
    if (value) el.textContent = value;
  });
  root.querySelectorAll("[data-setting-lines]").forEach((el) => {
    const value = s[el.dataset.settingLines] || "";
    el.innerHTML = value
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => `<p>${escapeHTML(l)}</p>`)
      .join("");
  });
  root.querySelectorAll("[data-map-embed]").forEach((frame) => {
    if (s.mapEmbed) frame.src = s.mapEmbed;
    else frame.closest(".location__map")?.classList.add("location__map--empty");
  });
  root.querySelectorAll("[data-mail]").forEach((el) => {
    if (s.email) {
      el.textContent = s.email;
      el.setAttribute("href", `mailto:${s.email}`);
    } else {
      (el.closest("[data-hide-empty]") || el).hidden = true;
    }
  });
  root.querySelectorAll("[data-href]").forEach((el) => {
    const key = el.dataset.href;
    const url = key === "maps" ? mapsLink() : s[key];
    if (url) el.setAttribute("href", url);
    else el.hidden = true;
  });
}
