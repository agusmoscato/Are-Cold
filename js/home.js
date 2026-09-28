/* Refrigeración Are-Cold — Inicio: ofertas, categorías y destacados */

document.addEventListener("DOMContentLoaded", () => {
  renderOffers();
  renderCategories();
  renderFeatured();
});

function renderOffers() {
  const track = document.querySelector("#offers-track");
  if (!track) return;
  const offers = AECOLD_DATA.products.filter((p) => p.tag === "oferta" || p.tag === "destacado");
  track.innerHTML = offers.map(offerCardHTML).join("");
}

function offerCardHTML(product) {
  return `
    <article class="offer-card">
      <button type="button" class="product-card__open" data-product-id="${product.id}" aria-haspopup="dialog" style="display:block;width:100%;text-align:left">
        <div class="offer-card__media">${photoBlockHTML(product.category, product.tag)}</div>
        <div class="offer-card__body">
          <h3>${product.name}</h3>
          <span class="cat">${categoryName(product.category)}</span>
          <span class="btn btn--whatsapp btn--sm btn--block">
            <svg class="icon" aria-hidden="true"><use href="#icon-whatsapp"></use></svg>
            Consultar
          </span>
        </div>
      </button>
    </article>
  `;
}

/* Mosaico asimétrico: Heladeras y Repuestos con tile grande,
   el resto en tamaño estándar, sin repetir la misma estructura en cada celda */
function renderCategories() {
  const mosaic = document.querySelector("#category-mosaic");
  if (!mosaic) return;

  const bigSlugs = new Set(["heladeras", "repuestos"]);

  mosaic.innerHTML = AECOLD_DATA.categories
    .map((cat) => {
      const isBig = bigSlugs.has(cat.slug);
      const variantClass = cat.slug === "repuestos" ? " cat-tile--accent" : isBig ? " cat-tile--big" : "";
      return `
        <a class="cat-tile${variantClass}" href="catalogo.html?cat=${cat.slug}">
          <svg class="icon" aria-hidden="true"><use href="#icon-${cat.icon}"></use></svg>
          <span>${cat.name}</span>
        </a>
      `;
    })
    .join("");
}

function renderFeatured() {
  const grid = document.querySelector("#featured-grid");
  if (!grid) return;
  const featured = AECOLD_DATA.products.filter((p) => p.tag === "destacado" || p.tag === "oferta").slice(0, 8);
  const list = featured.length ? featured : AECOLD_DATA.products.slice(0, 8);
  grid.innerHTML = list.map(productCardHTML).join("");
}
