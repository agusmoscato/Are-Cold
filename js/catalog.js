/* Refrigeración Are-Cold — catálogo: filtros, búsqueda y grilla */

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector("#catalog-grid");
  const chipRow = document.querySelector("#category-chips");
  const searchInput = document.querySelector("#catalog-search-input");
  const meta = document.querySelector("#catalog-meta");
  const emptyState = document.querySelector("#catalog-empty");

  if (!grid) return;

  buildChips();

  const params = new URLSearchParams(location.search);
  let activeCategory = params.get("cat") || "todas";
  let query = params.get("q") || "";

  if (searchInput) searchInput.value = query;
  syncActiveChip();
  render();

  function buildChips() {
    if (!chipRow) return;
    const chips = [{ slug: "todas", name: "Todas" }, ...AECOLD_DATA.categories];
    chipRow.innerHTML = chips
      .map(
        (c) =>
          `<button type="button" class="chip" data-cat="${c.slug}">${c.name}</button>`
      )
      .join("");

    chipRow.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      activeCategory = chip.dataset.cat;
      syncActiveChip();
      render();
    });
  }

  function syncActiveChip() {
    chipRow?.querySelectorAll(".chip").forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.cat === activeCategory);
    });
  }

  searchInput?.addEventListener("input", () => {
    query = searchInput.value.trim();
    render();
  });

  function getFiltered() {
    const q = query.toLowerCase();
    return AECOLD_DATA.products.filter((p) => {
      const matchesCat = activeCategory === "todas" || p.category === activeCategory;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        categoryName(p.category).toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }

  function render() {
    const items = getFiltered();

    grid.classList.add("is-filtering");
    requestAnimationFrame(() => {
      grid.innerHTML = items.map(productCardHTML).join("");
      grid.classList.remove("is-filtering");
    });

    if (meta) {
      const count = items.length;
      meta.textContent = `${count} ${count === 1 ? "producto encontrado" : "productos encontrados"}`;
    }

    if (emptyState) {
      emptyState.style.display = items.length ? "none" : "block";
    }
  }
});
