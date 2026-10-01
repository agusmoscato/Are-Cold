/* Refrigeración Are-Cold — catálogo: categoría → subcategoría, búsqueda y grilla.
   Los filtros quedan en la URL (?cat=...&sub=...&q=...) para que se puedan compartir.
   La lista de categorías es la misma en escritorio (barra lateral) y en celular (panel desde abajo). */

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector("#catalog-grid");
  const catList = document.querySelector("#filter-cats");
  const filters = document.querySelector("#filters");
  const openBtn = document.querySelector("#filters-open");
  const openLabel = document.querySelector("#filters-open-label");
  const applyBtn = document.querySelector("#filters-apply");
  const activeRow = document.querySelector("#active-filters");
  const searchInput = document.querySelector("#catalog-search-input");
  const meta = document.querySelector("#catalog-meta");
  const emptyState = document.querySelector("#catalog-empty");

  if (!grid) return;

  const params = new URLSearchParams(location.search);
  let activeCategory = getCategory(params.get("cat")) ? params.get("cat") : "";
  let activeSub = getSubcategory(activeCategory, params.get("sub")) ? params.get("sub") : "";
  let query = params.get("q") || "";

  if (searchInput) searchInput.value = query;
  render();

  if (params.get("p")) window.openProductModal?.(params.get("p"));

  /* ---------- Lista de categorías y subcategorías ---------- */
  function renderFilters() {
    const total = activeProducts().length;
    const item = (attrs, label, count, pressed, iconId, cls) => `
      <button type="button" class="${cls}" ${attrs} aria-pressed="${pressed}">
        ${iconId ? iconHTML(iconId) : ""}
        <span>${label}</span>
        <small>${count}</small>
        ${pressed ? iconHTML("check", "icon filter-check") : ""}
      </button>`;

    catList.innerHTML =
      `<li>${item('data-cat=""', "Todo el catálogo", total, !activeCategory, "box", "filter-cat")}</li>` +
      AECOLD_DATA.categories
        .map((c) => {
          const isActive = c.slug === activeCategory;
          const subs =
            isActive && c.subcategories.length
              ? `<ul class="filter-subs" aria-label="Tipos de ${escapeHTML(c.name)}">
                  <li>${item('data-sub=""', `Todo ${escapeHTML(c.name.toLowerCase())}`, countIn(c.slug), !activeSub, "", "filter-sub")}</li>
                  ${c.subcategories
                    .map(
                      (s) =>
                        `<li>${item(`data-sub="${s.slug}"`, escapeHTML(s.name), countIn(c.slug, s.slug), s.slug === activeSub, "", "filter-sub")}</li>`
                    )
                    .join("")}
                </ul>`
              : "";
          return `<li>${item(`data-cat="${c.slug}"`, escapeHTML(c.name), countIn(c.slug), isActive, c.icon, "filter-cat")}${subs}</li>`;
        })
        .join("");
  }

  catList.addEventListener("click", (e) => {
    const cat = e.target.closest("[data-cat]");
    const sub = e.target.closest("[data-sub]");
    if (cat) {
      activeCategory = cat.dataset.cat;
      activeSub = "";
    } else if (sub) {
      activeSub = sub.dataset.sub;
    } else return;
    render();
  });

  /* ---------- Filtros activos: se ven siempre, y se quitan con un toque ---------- */
  function renderActiveFilters() {
    const chips = [];
    if (activeCategory) chips.push({ key: "cat", label: categoryName(activeCategory) });
    if (activeSub) chips.push({ key: "sub", label: subcategoryName(activeCategory, activeSub) });
    if (query) chips.push({ key: "q", label: `“${query}”` });
    activeRow.hidden = !chips.length;
    activeRow.innerHTML =
      chips
        .map(
          (c) => `
          <button type="button" class="active-chip" data-clear="${c.key}" aria-label="Quitar filtro ${escapeHTML(c.label)}">
            ${escapeHTML(c.label)} ${iconHTML("close")}
          </button>`
        )
        .join("") +
      (chips.length > 1 ? '<button type="button" class="active-clear" data-clear="all">Limpiar todo</button>' : "");
  }

  activeRow.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-clear]");
    if (!btn) return;
    const key = btn.dataset.clear;
    if (key === "cat" || key === "all") {
      activeCategory = "";
      activeSub = "";
    }
    if (key === "sub") activeSub = "";
    if (key === "q" || key === "all") {
      query = "";
      searchInput.value = "";
    }
    render();
  });

  /* ---------- Panel de filtros en celular ---------- */
  const mobileQuery = window.matchMedia("(max-width: 959px)");

  function openFilters() {
    filters.classList.add("is-open");
    document.body.classList.add("filters-open", "nav-locked");
    openBtn.setAttribute("aria-expanded", "true");
    filters.querySelector('[aria-pressed="true"]')?.focus();
  }
  function closeFilters() {
    if (!filters.classList.contains("is-open")) return;
    filters.classList.remove("is-open");
    document.body.classList.remove("filters-open", "nav-locked");
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
    if (mobileQuery.matches) (activeRow.hidden ? meta : activeRow).scrollIntoView({ behavior: "smooth", block: "start" });
  }

  openBtn.addEventListener("click", openFilters);
  document.querySelectorAll("[data-filters-close]").forEach((el) => el.addEventListener("click", closeFilters));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFilters();
  });
  mobileQuery.addEventListener("change", () => {
    if (!mobileQuery.matches) closeFilters();
  });

  searchInput?.addEventListener("input", () => {
    query = searchInput.value.trim();
    render();
  });

  /* ---------- Resultados ---------- */
  function getFiltered() {
    const q = normalize(query);
    return activeProducts().filter((p) => {
      const matchesCat = !activeCategory || p.category === activeCategory;
      const matchesSub = !activeSub || p.subcategory === activeSub;
      const haystack = normalize(
        [p.name, categoryName(p.category), subcategoryName(p.category, p.subcategory), p.description, ...(p.features || [])].join(" ")
      );
      return matchesCat && matchesSub && (!q || haystack.includes(q));
    });
  }

  function normalize(text) {
    return String(text).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function syncURL() {
    const next = new URLSearchParams();
    if (activeCategory) next.set("cat", activeCategory);
    if (activeSub) next.set("sub", activeSub);
    if (query) next.set("q", query);
    const qs = next.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }

  function render() {
    const items = getFiltered();
    syncURL();
    renderFilters();
    renderActiveFilters();

    grid.classList.add("is-filtering");
    requestAnimationFrame(() => {
      grid.innerHTML = items.map(productCardHTML).join("");
      grid.classList.remove("is-filtering");
    });

    const count = items.length;
    const label = `${count} ${count === 1 ? "producto" : "productos"}`;
    meta.textContent = `${label} ${count === 1 ? "encontrado" : "encontrados"}`;
    applyBtn.textContent = count ? `Ver ${label}` : "Sin resultados: probá otra categoría";
    openLabel.textContent = activeCategory ? categoryName(activeCategory) : "Categorías";
    emptyState.style.display = count ? "none" : "block";
  }
});
