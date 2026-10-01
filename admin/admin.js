/* Panel de administración de Refrigeración Are-Cold.
   Ingresa contra el servidor (api/auth.php) y lee/guarda todo en la base (api/admin.php).
   AECOLD_DATA (js/store.js) es la copia en memoria de lo que devuelve el servidor:
   cada cambio se manda primero al servidor y recién con su respuesta se actualiza la pantalla. */

const API = "../api/";

const CATEGORY_ICONS = [
  ["heater", "Calefactor"], ["flame", "Llama"], ["ac", "Aire acondicionado"], ["snow", "Copo de nieve"],
  ["fridge", "Heladera"], ["freezer", "Freezer"], ["washer", "Lavarropas"], ["dryer", "Secarropas"],
  ["dishwasher", "Lavavajillas"], ["stove", "Cocina"], ["hood", "Campana"], ["waterheater", "Termotanque"],
  ["tv", "Televisor"], ["mattress", "Colchón"], ["blender", "Licuadora"], ["gear", "Engranaje"],
  ["box", "Caja"], ["tag", "Etiqueta"], ["star", "Estrella"], ["truck", "Camión"]
];
const TAGS = [["", "Sin etiqueta"], ["oferta", "Oferta"], ["destacado", "Destacado"], ["nuevo", "Nuevo"]];
const HERO_DEFAULT = "assets/fachada-local.jpg"; // foto original de la fachada
const HERO_LEGACY = "assets/fachada-placeholder.jpg"; // nombre anterior: se trata como la foto original

const db = AECOLD_DATA;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#icon-${id}"></use></svg>`;
const esc = escapeHTML;

/* Estado de la pantalla actual */
let listFilters = { q: "", cat: "", state: "all" };
let formDirty = false;
let lastHash = "";
let csrf = null;
let username = "";
let defaultPassword = false;

/* =========================================================
   Comunicación con el servidor
   ========================================================= */
class SessionExpired extends Error {}

async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, { credentials: "same-origin", ...options });
  } catch (e) {
    throw new Error("No hay conexión con el servidor. Revisá internet y probá de nuevo.");
  }
  let body = null;
  try { body = await res.json(); } catch (e) { /* respuesta vacía o no JSON */ }
  if (res.status === 401 && !url.includes("auth.php")) {
    throw new SessionExpired(body?.error || "Tu sesión se cerró. Volvé a ingresar.");
  }
  if (!res.ok || !body || body.ok === false) {
    throw new Error(body?.error || `El servidor respondió con un error (${res.status}).`);
  }
  return body;
}

function api(action, payload = {}) {
  return request(`${API}admin.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf || "" },
    body: JSON.stringify({ action, ...payload })
  });
}

/* Sube una foto (ya achicada en el navegador) y devuelve su ruta en el servidor */
async function uploadImage(blob, folder) {
  const form = new FormData();
  form.append("action", "upload");
  form.append("folder", folder);
  form.append("image", blob, "foto.jpg");
  const res = await request(`${API}admin.php`, { method: "POST", headers: { "X-CSRF-Token": csrf || "" }, body: form });
  return res.path;
}

async function loadData() {
  const res = await request(`${API}admin.php?action=data`);
  db.settings = res.data.settings || {};
  db.categories = res.data.categories;
  db.products = res.data.products;
}

/* Muestra el error del servidor; si la sesión venció, vuelve al ingreso */
function handleError(err) {
  if (err instanceof SessionExpired) {
    formDirty = false;
    showLogin(err.message);
    return;
  }
  toast(err.message || "No se pudo completar la acción.", true);
}

/* Para botones de guardar: los deshabilita mientras espera */
async function busy(button, fn) {
  const label = button?.innerHTML;
  if (button) {
    button.disabled = true;
    button.textContent = "Guardando…";
  }
  try {
    return await fn();
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = label;
    }
  }
}

/* =========================================================
   Ingreso
   ========================================================= */
async function boot() {
  if (location.protocol === "file:") {
    showBootError("El panel necesita el servidor", "Abriste el archivo directo desde la carpeta. El panel funciona solo publicado en el hosting (o con PHP en la computadora): ver PUBLICAR-EN-HOSTINGER.md.");
    return;
  }
  try {
    const me = await request(`${API}auth.php`);
    if (me.loggedIn) {
      csrf = me.csrf;
      username = me.username;
      defaultPassword = !!me.defaultPassword;
      await showApp();
      return;
    }
    showLogin();
  } catch (err) {
    // Sin base conectada el panel no muestra nada: acá se cargan datos reales, no de ejemplo
    showBootError("No se pudo conectar a la base de datos", err.message);
  }
}

function showBootError(title, message) {
  $("#boot-view").innerHTML = `
    <div class="boot__card" role="alert">
      <h1>${esc(title)}</h1>
      <p>${esc(message)}</p>
      <button type="button" class="btn btn--primary" onclick="location.reload()">Probar de nuevo</button>
    </div>`;
}

async function showApp() {
  await loadData();
  $("#boot-view").hidden = true;
  $("#login-view").hidden = true;
  $("#app").hidden = false;
  route();
}

function showLogin(message) {
  $("#boot-view").hidden = true;
  $("#app").hidden = true;
  $("#login-view").hidden = false;
  const error = $("#login-error");
  error.hidden = !message;
  error.textContent = message || "";
  $("#login-pass").value = "";
  $("#login-user").focus();
}

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const error = $("#login-error");
  const button = $("#login-submit");
  button.disabled = true;
  button.textContent = "Ingresando…";
  try {
    const res = await request(`${API}auth.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username: $("#login-user").value.trim(), password: $("#login-pass").value })
    });
    csrf = res.csrf;
    username = res.username;
    defaultPassword = !!res.defaultPassword;
    error.hidden = true;
    await showApp();
  } catch (err) {
    error.textContent = err.message;
    error.hidden = false;
    $("#login-pass").select();
  } finally {
    button.disabled = false;
    button.textContent = "Ingresar";
  }
});

$("#logout").addEventListener("click", async () => {
  if (formDirty && !(await confirmDialog("Tenés cambios sin guardar", "Si cerrás sesión ahora, se pierden.", "Cerrar sesión igual"))) return;
  formDirty = false;
  try {
    await request(`${API}auth.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
  } catch (e) { /* aunque falle, se sale igual */ }
  csrf = null;
  history.replaceState(null, "", location.pathname);
  showLogin();
});

/* =========================================================
   Navegación (#productos, #producto/ID, #producto/nuevo, #categorias, #negocio, #respaldo)
   ========================================================= */
window.addEventListener("hashchange", async () => {
  if ($("#app").hidden) return;
  if (formDirty) {
    const leave = await confirmDialog("Tenés cambios sin guardar", "Si salís de esta pantalla, se pierden los cambios que no guardaste.", "Salir sin guardar");
    if (!leave) {
      history.replaceState(null, "", lastHash);
      return;
    }
    formDirty = false;
  }
  route();
});

window.addEventListener("beforeunload", (e) => {
  if (formDirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

function route() {
  const hash = location.hash.replace(/^#/, "") || "productos";
  lastHash = `#${hash}`;
  const [section, id] = hash.split("/");
  const view = $("#view");

  if (section === "producto") renderProductForm(view, id === "nuevo" ? null : id);
  else if (section === "categorias") renderCategories(view);
  else if (section === "negocio") renderSettings(view);
  else if (section === "respaldo") renderBackup(view);
  else renderProductList(view);

  const navSection = section === "producto" ? "productos" : section;
  $$(".sidebar__nav a").forEach((a) => {
    if (a.dataset.section === navSection) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  if (defaultPassword && section !== "negocio") {
    view.insertAdjacentHTML(
      "afterbegin",
      `<div class="page"><div class="notice" style="margin-bottom:1.25rem">${icon("message")}<span>Estás usando la contraseña de prueba. <a href="#negocio" style="text-decoration:underline">Cambiala en Datos del negocio → Tu cuenta</a>.</span></div></div>`
    );
  }
  updateNavCount();
  view.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function updateNavCount() {
  $("#nav-count").textContent = db.products.length;
}

/* =========================================================
   Avisos y confirmaciones
   ========================================================= */
let toastTimer;
function toast(message, isError = false) {
  const el = $("#toast");
  el.innerHTML = `${icon(isError ? "close" : "check")}<span>${esc(message)}</span>`;
  el.classList.toggle("toast--error", isError);
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), isError ? 6000 : 2600);
}

function confirmDialog(title, text, okLabel = "Confirmar", danger = true) {
  const dialog = $("#confirm-dialog");
  $("#confirm-title").textContent = title;
  $("#confirm-text").textContent = text;
  const ok = $("#confirm-ok");
  ok.textContent = okLabel;
  ok.className = `btn ${danger ? "btn--danger" : "btn--primary"}`;
  dialog.returnValue = "";
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"), { once: true });
  });
}

function productLabel(p) {
  const sub = subcategoryName(p.category, p.subcategory);
  return sub ? `${categoryName(p.category)} · ${sub}` : categoryName(p.category);
}

function thumbHTML(src, catSlug) {
  return src
    ? `<img class="thumb" src="${esc(assetURL(src))}" alt="" loading="lazy">`
    : `<span class="thumb">${icon(categoryIcon(catSlug))}</span>`;
}

/* =========================================================
   Productos — listado
   ========================================================= */
function renderProductList(view) {
  const catOptions = db.categories
    .map((c) => `<option value="${c.slug}"${listFilters.cat === c.slug ? " selected" : ""}>${esc(c.name)}</option>`)
    .join("");

  view.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Productos</h1>
          <p id="list-summary"></p>
        </div>
        <div class="page-head__actions">
          <a class="btn btn--primary" href="#producto/nuevo">${icon("plus")} Nuevo producto</a>
        </div>
      </div>
      <div class="card">
        <div class="toolbar">
          <label class="toolbar__search">
            <span class="visually-hidden">Buscar productos</span>
            ${icon("search")}
            <input class="input" type="search" id="f-q" placeholder="Buscar por nombre…" value="${esc(listFilters.q)}">
          </label>
          <label>
            <span class="visually-hidden">Categoría</span>
            <select class="input" id="f-cat"><option value="">Todas las categorías</option>${catOptions}</select>
          </label>
          <label>
            <span class="visually-hidden">Estado</span>
            <select class="input" id="f-state">
              <option value="all">Visibles y dados de baja</option>
              <option value="active">Solo visibles</option>
              <option value="inactive">Solo dados de baja</option>
            </select>
          </label>
          <span class="toolbar__meta" id="list-count"></span>
        </div>
        <div id="list-body"></div>
      </div>
    </div>`;

  $("#f-state").value = listFilters.state;
  const update = () => {
    listFilters = { q: $("#f-q").value.trim(), cat: $("#f-cat").value, state: $("#f-state").value };
    renderRows();
  };
  $("#f-q").addEventListener("input", update);
  $("#f-cat").addEventListener("change", update);
  $("#f-state").addEventListener("change", update);

  $("#list-body").addEventListener("change", async (e) => {
    const sw = e.target.closest("[data-toggle-active]");
    if (!sw) return;
    const p = findProduct(sw.dataset.toggleActive);
    const active = sw.checked;
    sw.disabled = true;
    try {
      await api("setProductActive", { id: p.id, active });
      p.active = active;
      toast(active ? `“${p.name}” vuelve a verse en el sitio` : `“${p.name}” quedó dado de baja: ya no se ve en el sitio`);
    } catch (err) {
      sw.checked = !active;
      handleError(err);
    }
    renderRows();
  });

  $("#list-body").addEventListener("click", async (e) => {
    const del = e.target.closest("[data-delete]");
    if (!del) return;
    const p = findProduct(del.dataset.delete);
    const ok = await confirmDialog(
      `¿Eliminar “${p.name}”?`,
      "Se borra para siempre, con sus fotos. Si solo querés ocultarlo un tiempo, apagá “Visible” y queda dado de baja.",
      "Eliminar producto"
    );
    if (!ok) return;
    try {
      await api("deleteProduct", { id: p.id });
      db.products = db.products.filter((x) => x.id !== p.id);
      toast("Producto eliminado");
      renderRows();
      updateNavCount();
    } catch (err) {
      handleError(err);
    }
  });

  renderRows();
}

function renderRows() {
  const q = listFilters.q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  // Los más nuevos primero
  const items = [...db.products].reverse().filter((p) => {
    const name = p.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (q && !name.includes(q)) return false;
    if (listFilters.cat && p.category !== listFilters.cat) return false;
    if (listFilters.state === "active" && p.active === false) return false;
    if (listFilters.state === "inactive" && p.active !== false) return false;
    return true;
  });

  const total = db.products.length;
  const inactive = db.products.filter((p) => p.active === false).length;
  $("#list-summary").textContent = `${total} productos en total · ${total - inactive} visibles en el sitio${inactive ? ` · ${inactive} dados de baja` : ""}`;
  $("#list-count").textContent = items.length === total ? "" : `Mostrando ${items.length} de ${total}`;

  if (!items.length) {
    const noneAtAll = !db.products.length;
    $("#list-body").innerHTML = `
      <div class="empty">
        <h3>${noneAtAll ? "Todavía no hay productos cargados" : "Ningún producto coincide con la búsqueda"}</h3>
        <p>${noneAtAll ? "Cargá el primero para que aparezca en el catálogo." : "Probá con otra palabra o cambiá los filtros."}</p>
        ${noneAtAll ? `<a class="btn btn--primary" href="#producto/nuevo">${icon("plus")} Nuevo producto</a>` : ""}
      </div>`;
    return;
  }

  $("#list-body").innerHTML = `
    <table class="table">
      <thead>
        <tr><th>Producto</th><th>Etiqueta</th><th>Visible</th><th class="cell-actions"><span class="visually-hidden">Acciones</span></th></tr>
      </thead>
      <tbody>
        ${items
          .map((p) => {
            const active = p.active !== false;
            const tag = TAGS.find(([v]) => v === (p.tag || ""));
            return `
            <tr class="${active ? "" : "is-inactive"}">
              <td class="cell-main">
                <div class="cell-product">
                  ${thumbHTML((p.images || [])[0], p.category)}
                  <div>
                    <a href="#producto/${p.id}">${esc(p.name)}</a>
                    <small>${esc(productLabel(p))}${(p.images || []).length > 1 ? ` · ${p.images.length} fotos` : ""}</small>
                  </div>
                </div>
              </td>
              <td class="cell-tag">${p.tag ? `<span class="pill pill--${p.tag}">${tag[1]}</span>` : ""}</td>
              <td>
                <label class="switch" title="${active ? "Se ve en el sitio" : "Dado de baja: no se ve en el sitio"}">
                  <input type="checkbox" data-toggle-active="${p.id}"${active ? " checked" : ""}>
                  <span class="switch__track"></span>
                  <span>${active ? "Sí" : "No"}</span>
                </label>
              </td>
              <td class="cell-actions">
                <a class="btn btn--ghost btn--sm" href="#producto/${p.id}">${icon("edit")} Editar</a>
                <button type="button" class="icon-btn icon-btn--danger" data-delete="${p.id}" aria-label="Eliminar ${esc(p.name)}" title="Eliminar">${icon("trash")}</button>
              </td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>`;
}

/* =========================================================
   Productos — alta y edición
   ========================================================= */
function renderProductForm(view, id) {
  const existing = id ? findProduct(id) : null;
  if (id && !existing) {
    view.innerHTML = `<div class="page"><div class="card empty"><h3>Ese producto ya no existe</h3><p>Puede que lo hayan eliminado.</p><a class="btn btn--primary" href="#productos">Volver a productos</a></div></div>`;
    return;
  }

  // Trabajamos sobre una copia: nada se guarda hasta tocar "Guardar"
  const draft = existing
    ? JSON.parse(JSON.stringify(existing))
    : { id: "", name: "", category: listFilters.cat || "", subcategory: "", tag: "", active: true, description: "", features: [], images: [] };
  if (!draft.features.length) draft.features.push("");
  formDirty = false;

  const catOptions = db.categories
    .map((c) => `<option value="${c.slug}"${draft.category === c.slug ? " selected" : ""}>${esc(c.name)}</option>`)
    .join("");
  const tagOptions = TAGS.map(([v, l]) => `<option value="${v}"${draft.tag === v ? " selected" : ""}>${l}</option>`).join("");

  view.innerHTML = `
    <div class="page">
      <a class="back-link" href="#productos">${icon("arrow-left")} Productos</a>
      <div class="page-head">
        <div>
          <h1>${existing ? "Editar producto" : "Nuevo producto"}</h1>
          ${existing ? `<p>${esc(existing.name)}</p>` : "<p>Completá los datos y guardá para que aparezca en el catálogo.</p>"}
        </div>
      </div>

      <form id="product-form" novalidate>
        <div class="editor">
          <div class="editor__col">
            <section class="card">
              <div class="card__head"><h2>Información</h2></div>
              <div class="card__body">
                <label class="field" id="field-name">
                  <span class="field__label">Nombre</span>
                  <input type="text" id="p-name" value="${esc(draft.name)}" placeholder="Ej: Aire acondicionado split frío/calor 3000 frigorías" maxlength="120">
                  <span class="field__error" hidden>Escribí el nombre del producto.</span>
                </label>
                <div class="row-2">
                  <label class="field" id="field-cat">
                    <span class="field__label">Categoría</span>
                    <select id="p-cat"><option value="">Elegí una categoría</option>${catOptions}</select>
                    <span class="field__error" hidden>Elegí en qué categoría va.</span>
                  </label>
                  <label class="field">
                    <span class="field__label">Subcategoría</span>
                    <select id="p-sub"></select>
                    <span class="field__hint" id="p-sub-hint"></span>
                  </label>
                </div>
                <label class="field">
                  <span class="field__label">Descripción</span>
                  <textarea id="p-desc" rows="4" placeholder="Para qué sirve, a quién le conviene, qué lo diferencia.">${esc(draft.description)}</textarea>
                </label>
              </div>
            </section>

            <section class="card">
              <div class="card__head">
                <div><h2>Características</h2><p>Una por renglón: capacidad, medidas, consumo, etc.</p></div>
              </div>
              <div class="card__body">
                <div class="features" id="features"></div>
                <div><button type="button" class="btn btn--ghost btn--sm" id="add-feature">${icon("plus")} Agregar característica</button></div>
              </div>
            </section>
          </div>

          <div class="editor__col">
            <section class="card">
              <div class="card__head"><h2>Publicación</h2></div>
              <div class="card__body">
                <label class="switch">
                  <input type="checkbox" id="p-active"${draft.active !== false ? " checked" : ""}>
                  <span class="switch__track"></span>
                  <span>Visible en el sitio</span>
                </label>
                <label class="field">
                  <span class="field__label">Etiqueta</span>
                  <select id="p-tag">${tagOptions}</select>
                  <span class="field__hint">Aparece sobre la foto en el catálogo.</span>
                </label>
              </div>
            </section>

            <section class="card">
              <div class="card__head">
                <div><h2>Fotos</h2><p>La primera es la principal. Arrastralas para cambiar el orden.</p></div>
              </div>
              <div class="card__body">
                <label class="dropzone" id="dropzone">
                  ${icon("upload")}
                  <strong>Subir fotos</strong>
                  <span>Arrastralas acá o hacé clic para elegirlas</span>
                  <input type="file" id="p-files" accept="image/*" multiple>
                </label>
                <div class="photos" id="photos"></div>
              </div>
            </section>

            ${
              existing
                ? `<section class="card">
                    <div class="card__body danger-zone">
                      <p>Eliminar borra el producto para siempre. Para ocultarlo un tiempo, apagá “Visible en el sitio”.</p>
                      <button type="button" class="btn btn--danger-ghost btn--sm" id="delete-product">${icon("trash")} Eliminar producto</button>
                    </div>
                  </section>`
                : ""
            }
          </div>
        </div>

        <div class="sticky-actions">
          <a class="btn btn--ghost" href="#productos">Cancelar</a>
          <span class="upload-status" id="upload-status" role="status" hidden></span>
          <button type="submit" class="btn btn--primary" id="product-save">${existing ? "Guardar cambios" : "Guardar producto"}</button>
        </div>
      </form>
    </div>`;

  const form = $("#product-form");
  form.addEventListener("input", () => (formDirty = true));
  form.addEventListener("change", () => (formDirty = true));

  /* Subcategorías según la categoría elegida */
  const fillSubs = () => {
    const cat = getCategory($("#p-cat").value);
    const subs = cat?.subcategories || [];
    $("#p-sub").innerHTML = `<option value="">${subs.length ? "Sin subcategoría" : "—"}</option>${subs
      .map((s) => `<option value="${s.slug}"${draft.subcategory === s.slug ? " selected" : ""}>${esc(s.name)}</option>`)
      .join("")}`;
    $("#p-sub").disabled = !subs.length;
    $("#p-sub-hint").textContent = cat && !subs.length ? "Esta categoría no tiene subcategorías. Se agregan desde Categorías." : "";
  };
  $("#p-cat").addEventListener("change", () => {
    draft.subcategory = "";
    fillSubs();
  });
  fillSubs();

  /* Características: lista editable */
  const renderFeatures = () => {
    $("#features").innerHTML = draft.features
      .map(
        (f, i) => `
        <div class="feature-row">
          <input class="input" type="text" value="${esc(f)}" data-feature="${i}" placeholder="Ej: Capacidad aproximada: 300 litros" aria-label="Característica ${i + 1}">
          <button type="button" class="icon-btn" data-feature-move="${i}:-1" aria-label="Subir"${i === 0 ? " disabled" : ""}>${icon("arrow-up")}</button>
          <button type="button" class="icon-btn" data-feature-move="${i}:1" aria-label="Bajar"${i === draft.features.length - 1 ? " disabled" : ""}>${icon("arrow-down")}</button>
          <button type="button" class="icon-btn icon-btn--danger" data-feature-remove="${i}" aria-label="Quitar característica">${icon("trash")}</button>
        </div>`
      )
      .join("");
  };
  const addFeature = () => {
    draft.features.push("");
    renderFeatures();
    $(`[data-feature="${draft.features.length - 1}"]`).focus();
    formDirty = true;
  };
  $("#features").addEventListener("input", (e) => {
    const i = e.target.dataset.feature;
    if (i !== undefined) draft.features[i] = e.target.value;
  });
  $("#features").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.dataset.feature !== undefined) {
      e.preventDefault();
      addFeature();
    }
  });
  $("#features").addEventListener("click", (e) => {
    const move = e.target.closest("[data-feature-move]");
    const remove = e.target.closest("[data-feature-remove]");
    if (move) {
      const [i, dir] = move.dataset.featureMove.split(":").map(Number);
      swap(draft.features, i, i + dir);
    } else if (remove) {
      draft.features.splice(Number(remove.dataset.featureRemove), 1);
      if (!draft.features.length) draft.features.push("");
    } else return;
    formDirty = true;
    renderFeatures();
  });
  $("#add-feature").addEventListener("click", addFeature);
  renderFeatures();

  /* Fotos: subir varias, reordenar, elegir principal, quitar */
  const renderPhotos = () => {
    $("#photos").innerHTML = draft.images
      .map(
        (src, i) => `
        <div class="photo" draggable="true" data-photo="${i}">
          <img src="${esc(assetURL(src))}" alt="Foto ${i + 1}">
          ${i === 0 ? '<span class="photo__badge">Principal</span>' : ""}
          <div class="photo__tools">
            ${i === 0 ? "<span></span>" : `<button type="button" class="icon-btn" data-photo-main="${i}" aria-label="Hacer principal" title="Hacer principal">${icon("star")}</button>`}
            <div>
              <button type="button" class="icon-btn" data-photo-move="${i}:-1" aria-label="Mover antes"${i === 0 ? " disabled" : ""}>${icon("arrow-left")}</button>
              <button type="button" class="icon-btn" data-photo-move="${i}:1" aria-label="Mover después"${i === draft.images.length - 1 ? " disabled" : ""}>${icon("arrow-right")}</button>
              <button type="button" class="icon-btn icon-btn--danger" data-photo-remove="${i}" aria-label="Quitar foto">${icon("trash")}</button>
            </div>
          </div>
        </div>`
      )
      .join("");
  };
  // Cada foto se achica en el navegador y se sube al servidor; el producto guarda solo la ruta
  let uploading = 0;
  const saveBtn = () => $("#product-save");
  const syncUploading = () => {
    saveBtn().disabled = uploading > 0;
    $("#upload-status").hidden = uploading === 0;
    $("#upload-status").textContent = uploading === 1 ? "Subiendo 1 foto…" : `Subiendo ${uploading} fotos…`;
  };
  const addFiles = async (files) => {
    const images = [...files].filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    uploading += images.length;
    syncUploading();
    for (const file of images) {
      try {
        const path = await uploadImage(await resizeImage(file), "products");
        draft.images.push(path);
        formDirty = true;
        renderPhotos();
      } catch (err) {
        if (err instanceof SessionExpired) {
          handleError(err);
          return;
        }
        toast(err.message ? `“${file.name}”: ${err.message}` : `No se pudo leer “${file.name}”. Probá con otro archivo (JPG o PNG).`, true);
      } finally {
        uploading -= 1;
        syncUploading();
      }
    }
  };
  $("#p-files").addEventListener("change", (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  });
  const dz = $("#dropzone");
  dz.addEventListener("dragover", (e) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    dz.classList.add("is-over");
  });
  dz.addEventListener("dragleave", () => dz.classList.remove("is-over"));
  dz.addEventListener("drop", (e) => {
    e.preventDefault();
    dz.classList.remove("is-over");
    addFiles(e.dataTransfer.files);
  });

  $("#photos").addEventListener("click", (e) => {
    const main = e.target.closest("[data-photo-main]");
    const move = e.target.closest("[data-photo-move]");
    const remove = e.target.closest("[data-photo-remove]");
    if (main) {
      const [img] = draft.images.splice(Number(main.dataset.photoMain), 1);
      draft.images.unshift(img);
    } else if (move) {
      const [i, dir] = move.dataset.photoMove.split(":").map(Number);
      swap(draft.images, i, i + dir);
    } else if (remove) {
      draft.images.splice(Number(remove.dataset.photoRemove), 1);
    } else return;
    formDirty = true;
    renderPhotos();
  });

  // Reordenar arrastrando
  let dragFrom = null;
  $("#photos").addEventListener("dragstart", (e) => {
    const card = e.target.closest("[data-photo]");
    if (!card) return;
    dragFrom = Number(card.dataset.photo);
    card.classList.add("is-dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(dragFrom));
  });
  $("#photos").addEventListener("dragover", (e) => {
    const card = e.target.closest("[data-photo]");
    if (dragFrom === null || !card) return;
    e.preventDefault();
    $$(".photo", $("#photos")).forEach((c) => c.classList.toggle("is-drop-target", c === card));
  });
  $("#photos").addEventListener("drop", (e) => {
    const card = e.target.closest("[data-photo]");
    if (dragFrom === null || !card) return;
    e.preventDefault();
    const to = Number(card.dataset.photo);
    const [img] = draft.images.splice(dragFrom, 1);
    draft.images.splice(to, 0, img);
    dragFrom = null;
    formDirty = true;
    renderPhotos();
  });
  $("#photos").addEventListener("dragend", () => {
    dragFrom = null;
    $$(".photo", $("#photos")).forEach((c) => c.classList.remove("is-dragging", "is-drop-target"));
  });
  renderPhotos();

  /* Eliminar */
  $("#delete-product")?.addEventListener("click", async () => {
    const ok = await confirmDialog(
      `¿Eliminar “${existing.name}”?`,
      "Se borra para siempre, con sus fotos. Si solo querés ocultarlo, apagá “Visible en el sitio” y guardá.",
      "Eliminar producto"
    );
    if (!ok) return;
    try {
      await api("deleteProduct", { id: existing.id });
      db.products = db.products.filter((x) => x.id !== existing.id);
      toast("Producto eliminado");
      formDirty = false;
      location.hash = "#productos";
    } catch (err) {
      handleError(err);
    }
  });

  /* Guardar */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (uploading > 0) return;
    const name = $("#p-name").value.trim();
    const category = $("#p-cat").value;
    $("#field-name").classList.toggle("is-invalid", !name);
    $("#field-name .field__error").hidden = !!name;
    $("#field-cat").classList.toggle("is-invalid", !category);
    $("#field-cat .field__error").hidden = !!category;
    if (!name || !category) {
      (!name ? $("#p-name") : $("#p-cat")).focus();
      return;
    }

    const product = {
      id: existing ? existing.id : "",
      name,
      category,
      subcategory: $("#p-sub").value,
      tag: $("#p-tag").value,
      active: $("#p-active").checked,
      description: $("#p-desc").value.trim(),
      features: draft.features.map((f) => f.trim()).filter(Boolean),
      images: draft.images
    };

    try {
      const res = await busy(saveBtn(), () => api("saveProduct", { product }));
      const index = db.products.findIndex((p) => p.id === res.product.id);
      if (index >= 0) db.products[index] = res.product;
      else db.products.push(res.product);
      toast(existing ? "Cambios guardados" : "Producto guardado");
      formDirty = false;
      location.hash = "#productos";
    } catch (err) {
      handleError(err);
    }
  });
}

function swap(arr, a, b) {
  if (b < 0 || b >= arr.length) return;
  [arr[a], arr[b]] = [arr[b], arr[a]];
}

/* Achica la foto en el navegador antes de subirla (máx. 1600 px, JPG): sube más rápido desde el celular */
function resizeImage(file, maxSize = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff"; // fondo blanco para PNG con transparencia
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo procesar la foto."))), "image/jpeg", quality);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* =========================================================
   Categorías y subcategorías (los cambios se guardan al momento)
   ========================================================= */
function renderCategories(view) {
  const iconOptions = (selected) =>
    CATEGORY_ICONS.map(([id, label]) => `<option value="${id}"${id === selected ? " selected" : ""}>${label}</option>`).join("");

  view.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Categorías</h1>
          <p>El orden de esta lista es el orden del menú y de la grilla del inicio. Los cambios se guardan solos.</p>
        </div>
      </div>

      <section class="card" style="margin-bottom:1.25rem">
        <div class="card__head"><h2>Nueva categoría</h2></div>
        <form class="card__body cat-new" id="cat-new">
          <label class="field">
            <span class="field__label">Nombre</span>
            <input type="text" id="cat-new-name" placeholder="Ej: Ventiladores" maxlength="60">
          </label>
          <label class="field field--icon">
            <span class="field__label">Ícono</span>
            <select id="cat-new-icon">${iconOptions("box")}</select>
          </label>
          <button type="submit" class="btn btn--primary">${icon("plus")} Agregar categoría</button>
        </form>
      </section>

      <div class="cat-list" id="cat-list"></div>
    </div>`;

  const list = $("#cat-list");

  const render = () => {
    list.innerHTML = db.categories
      .map((c, i) => {
        const total = db.products.filter((p) => p.category === c.slug).length;
        return `
        <article class="card cat-item" data-cat="${c.slug}">
          <div class="cat-item__head">
            <div class="cat-item__order">
              <button type="button" class="icon-btn" data-cat-move="-1" aria-label="Subir ${esc(c.name)}"${i === 0 ? " disabled" : ""}>${icon("arrow-up")}</button>
              <button type="button" class="icon-btn" data-cat-move="1" aria-label="Bajar ${esc(c.name)}"${i === db.categories.length - 1 ? " disabled" : ""}>${icon("arrow-down")}</button>
            </div>
            <span class="cat-item__icon">${icon(c.icon)}</span>
            <input class="input cat-item__name" type="text" value="${esc(c.name)}" data-cat-rename aria-label="Nombre de la categoría" maxlength="60">
            <div class="cat-item__tools">
              <span class="cat-item__meta">${total} ${total === 1 ? "producto" : "productos"}</span>
              <label class="switch" title="Aparece con una tarjeta grande en el inicio">
                <input type="checkbox" data-cat-highlight${c.highlight ? " checked" : ""}>
                <span class="switch__track"></span>
                <span>Destacada en el inicio</span>
              </label>
              <button type="button" class="icon-btn icon-btn--danger" data-cat-delete aria-label="Eliminar ${esc(c.name)}"
                title="${total ? `Tiene ${total} productos: movelos o eliminalos antes` : "Eliminar categoría"}"${total ? " disabled" : ""}>${icon("trash")}</button>
            </div>
          </div>
          <div class="cat-item__body">
            <div class="row-2">
              <div class="cat-photo">
                ${c.image ? `<img src="${esc(assetURL(c.image))}" alt="">` : `<span class="thumb">${icon("image")}</span>`}
                <label class="btn btn--ghost btn--sm">${icon("upload")} ${c.image ? "Cambiar foto" : "Subir foto"}
                  <input type="file" accept="image/*" data-cat-photo>
                </label>
              </div>
              <label class="field">
                <span class="visually-hidden">Ícono</span>
                <select class="input" data-cat-icon aria-label="Ícono de ${esc(c.name)}">${iconOptions(c.icon)}</select>
              </label>
            </div>
            <div>
              <p class="cat-item__section-title">Subcategorías</p>
            </div>
            <div class="sub-list">
              ${
                c.subcategories.length
                  ? c.subcategories
                      .map((s, j) => {
                        const n = db.products.filter((p) => p.category === c.slug && p.subcategory === s.slug).length;
                        return `
                    <div class="sub-row" data-sub="${s.slug}">
                      <input class="input" type="text" value="${esc(s.name)}" data-sub-rename aria-label="Nombre de la subcategoría" maxlength="60">
                      <small>${n} ${n === 1 ? "producto" : "productos"}</small>
                      <button type="button" class="icon-btn" data-sub-move="-1" aria-label="Subir"${j === 0 ? " disabled" : ""}>${icon("arrow-up")}</button>
                      <button type="button" class="icon-btn" data-sub-move="1" aria-label="Bajar"${j === c.subcategories.length - 1 ? " disabled" : ""}>${icon("arrow-down")}</button>
                      <button type="button" class="icon-btn icon-btn--danger" data-sub-delete aria-label="Eliminar ${esc(s.name)}">${icon("trash")}</button>
                    </div>`;
                      })
                      .join("")
                  : '<p class="field__hint">Sin subcategorías: en el catálogo se muestran todos sus productos juntos.</p>'
              }
            </div>
            <form class="sub-add" data-sub-add>
              <input class="input" type="text" placeholder="Nueva subcategoría" aria-label="Nueva subcategoría para ${esc(c.name)}" maxlength="60">
              <button type="submit" class="btn btn--ghost btn--sm">${icon("plus")} Agregar</button>
            </form>
          </div>
        </article>`;
      })
      .join("");
  };

  const catFrom = (el) => getCategory(el.closest("[data-cat]").dataset.cat);

  /* Manda la lista completa al servidor. Si falla, recarga lo que hay guardado para no mostrar algo falso */
  const saveCats = async (message, rerender = true) => {
    try {
      const res = await api("saveCategories", { categories: db.categories });
      db.categories = res.categories;
      toast(message);
      if (rerender) render();
      return true;
    } catch (err) {
      handleError(err);
      try { await loadData(); } catch (e) { /* sin conexión: queda lo que había */ }
      render();
      return false;
    }
  };

  $("#cat-new").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#cat-new-name").value.trim();
    if (!name) {
      $("#cat-new-name").focus();
      return;
    }
    const slug = uniqueSlug(name, db.categories.map((c) => c.slug));
    db.categories.push({ slug, name, icon: $("#cat-new-icon").value, image: "", highlight: false, subcategories: [] });
    if (await saveCats(`Categoría “${name}” agregada al final de la lista`)) $("#cat-new-name").value = "";
  });

  list.addEventListener("change", async (e) => {
    const t = e.target;
    const cat = catFrom(t);
    if (t.matches("[data-cat-rename]")) {
      const name = t.value.trim();
      if (!name) {
        t.value = cat.name;
        return;
      }
      cat.name = name;
      saveCats("Nombre guardado", false);
    } else if (t.matches("[data-cat-icon]")) {
      cat.icon = t.value;
      saveCats("Ícono guardado");
    } else if (t.matches("[data-cat-highlight]")) {
      const highlighted = db.categories.filter((c) => c.highlight && c !== cat).length;
      if (t.checked && highlighted >= 2) {
        t.checked = false;
        toast("Solo puede haber 2 categorías destacadas en el inicio. Desactivá otra primero.", true);
        return;
      }
      cat.highlight = t.checked;
      saveCats(t.checked ? `“${cat.name}” ahora se destaca en el inicio` : `“${cat.name}” ya no se destaca en el inicio`, false);
    } else if (t.matches("[data-cat-photo]") && t.files[0]) {
      toast("Subiendo la foto…");
      try {
        cat.image = await uploadImage(await resizeImage(t.files[0], 1400, 0.82), "categories");
      } catch (err) {
        handleError(err.message ? err : new Error("No se pudo leer esa imagen. Probá con un JPG o PNG."));
        return;
      }
      saveCats("Foto de la categoría guardada");
    } else if (t.matches("[data-sub-rename]")) {
      const sub = cat.subcategories.find((s) => s.slug === t.closest("[data-sub]").dataset.sub);
      const name = t.value.trim();
      if (!name) {
        t.value = sub.name;
        return;
      }
      sub.name = name;
      saveCats("Nombre guardado", false);
    }
  });

  list.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn || btn.disabled) return;
    const cat = catFrom(btn);
    const i = db.categories.indexOf(cat);

    if (btn.matches("[data-cat-move]")) {
      swap(db.categories, i, i + Number(btn.dataset.catMove));
      saveCats("Orden guardado");
    } else if (btn.matches("[data-cat-delete]")) {
      const ok = await confirmDialog(`¿Eliminar la categoría “${cat.name}”?`, "Desaparece del menú y del catálogo.", "Eliminar categoría");
      if (!ok) return;
      db.categories.splice(i, 1);
      saveCats("Categoría eliminada");
    } else if (btn.matches("[data-sub-move]")) {
      const j = cat.subcategories.findIndex((s) => s.slug === btn.closest("[data-sub]").dataset.sub);
      swap(cat.subcategories, j, j + Number(btn.dataset.subMove));
      saveCats("Orden guardado");
    } else if (btn.matches("[data-sub-delete]")) {
      const slug = btn.closest("[data-sub]").dataset.sub;
      const sub = cat.subcategories.find((s) => s.slug === slug);
      const using = db.products.filter((p) => p.category === cat.slug && p.subcategory === slug);
      const ok = await confirmDialog(
        `¿Eliminar “${sub.name}”?`,
        using.length
          ? `${using.length} ${using.length === 1 ? "producto usa" : "productos usan"} esta subcategoría. Van a quedar dentro de “${cat.name}”, sin subcategoría.`
          : "No hay productos cargados en esta subcategoría.",
        "Eliminar subcategoría"
      );
      if (!ok) return;
      cat.subcategories = cat.subcategories.filter((s) => s.slug !== slug);
      if (await saveCats("Subcategoría eliminada")) using.forEach((p) => (p.subcategory = ""));
    }
  });

  list.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target.closest("[data-sub-add]");
    if (!form) return;
    const cat = catFrom(form);
    const input = form.querySelector("input");
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }
    cat.subcategories.push({ slug: uniqueSlug(name, cat.subcategories.map((s) => s.slug)), name });
    if (await saveCats(`Subcategoría “${name}” agregada`)) $(`[data-cat="${cat.slug}"] [data-sub-add] input`)?.focus();
  });

  render();
}

function uniqueSlug(name, taken) {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (taken.includes(slug)) slug = `${base}-${n++}`;
  return slug;
}

/* =========================================================
   Datos del negocio
   ========================================================= */
function renderSettings(view) {
  const s = db.settings;
  let heroImage = !s.heroImage || s.heroImage === HERO_LEGACY ? HERO_DEFAULT : s.heroImage;

  const field = (id, label, value, opts = {}) => `
    <label class="field" id="field-${id}">
      <span class="field__label">${label}</span>
      ${
        opts.textarea
          ? `<textarea id="s-${id}" rows="${opts.rows || 3}" placeholder="${esc(opts.placeholder || "")}">${esc(value)}</textarea>`
          : `<input type="${opts.type || "text"}" id="s-${id}" value="${esc(value)}" placeholder="${esc(opts.placeholder || "")}">`
      }
      ${opts.hint ? `<span class="field__hint">${opts.hint}</span>` : ""}
      <span class="field__error" hidden></span>
    </label>`;
  const linkField = (id, label, value, placeholder) => `
    <label class="field" id="field-${id}">
      <span class="field__label">${label}</span>
      <span class="input-with-btn">
        <input type="url" id="s-${id}" value="${esc(value)}" placeholder="${placeholder}">
        <button type="button" class="btn btn--ghost" data-test-link="${id}">Probar link</button>
      </span>
      <span class="field__hint">Abrilo con “Probar link” y fijate que sea la cuenta correcta.</span>
      <span class="field__error" hidden></span>
    </label>`;

  view.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Datos del negocio</h1>
          <p>Se usan en todo el sitio: header, pie de página, contacto y botones de WhatsApp.</p>
        </div>
      </div>
      <form class="settings" id="settings-form" novalidate>
        <section class="card">
          <div class="card__head"><h2>WhatsApp</h2></div>
          <div class="card__body">
            <div class="row-2">
              ${field("whatsapp", "Número para los botones", s.whatsapp, { placeholder: "5492326422390", hint: "Con 549 + característica + número, sin espacios ni guiones." })}
              ${field("whatsappDisplay", "Número como se muestra", s.whatsappDisplay, { placeholder: "2326-422390", hint: "Así lo lee la gente en el sitio." })}
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card__head"><h2>Local</h2></div>
          <div class="card__body">
            <div class="row-2">
              ${field("address", "Dirección", s.address, { placeholder: "Italia 727" })}
              ${field("city", "Ciudad", s.city, { placeholder: "San Antonio de Areco", hint: "La usa el botón “Cómo llegar”." })}
            </div>
            ${field("hours", "Horarios", s.hours, { textarea: true, rows: 3, hint: "Cada renglón se muestra como una línea." })}
            ${field("hoursShort", "Horario resumido", s.hoursShort, { hint: "Versión corta para el pie de página." })}
            ${field("mapEmbed", "Mapa", s.mapEmbed, {
              textarea: true,
              rows: 3,
              placeholder: '<iframe src="https://www.google.com/maps/embed?..."></iframe>',
              hint: "En Google Maps: buscá el local → Compartir → Insertar un mapa → Copiar HTML, y pegalo acá."
            })}
          </div>
        </section>

        <section class="card">
          <div class="card__head"><div><h2>Foto del local</h2><p>Fondo de la parte de arriba del inicio. Ideal: la fachada, horizontal.</p></div></div>
          <div class="card__body">
            <div class="hero-photo">
              <img id="hero-preview" src="${esc(assetURL(heroImage))}" alt="Foto actual del local">
              <div class="hero-photo__actions">
                <p class="field__hint" id="hero-note"></p>
                <label class="btn btn--ghost">${icon("upload")} Subir foto del local
                  <input type="file" accept="image/*" id="hero-file" class="visually-hidden">
                </label>
                <button type="button" class="btn btn--ghost" id="hero-reset">Volver a la foto original</button>
              </div>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card__head"><h2>Redes sociales</h2></div>
          <div class="card__body">
            ${linkField("instagram", "Instagram", s.instagram, "https://www.instagram.com/usuario")}
            ${linkField("facebook", "Facebook", s.facebook, "https://www.facebook.com/pagina")}
          </div>
        </section>

        <section class="card">
          <div class="card__head"><div><h2>Textos del inicio</h2><p>Lo primero que se lee al entrar al sitio.</p></div></div>
          <div class="card__body">
            ${field("heroEyebrow", "Texto chico de arriba", s.heroEyebrow)}
            <div class="row-2">
              ${field("heroTitle", "Título", s.heroTitle)}
              ${field("heroHighlight", "Final del título, en naranja", s.heroHighlight, { hint: "Se pega al final del título. Puede quedar vacío." })}
            </div>
            ${field("heroText", "Texto de presentación", s.heroText, { textarea: true, rows: 3 })}
          </div>
        </section>

        <section class="card">
          <div class="card__head"><div><h2>Marcas</h2><p>La tira de marcas del inicio.</p></div></div>
          <div class="card__body">
            ${field("brands", "Marcas que se muestran", (s.brands || []).join("\n"), { textarea: true, rows: 6, hint: "Una por renglón. Si queda vacío, la tira no se muestra." })}
          </div>
        </section>

        <div class="sticky-actions">
          <button type="submit" class="btn btn--primary" id="settings-save">Guardar datos</button>
        </div>
      </form>

      <form class="settings" id="password-form" novalidate style="margin-top:1.25rem">
        <section class="card">
          <div class="card__head"><div><h2>Tu cuenta</h2><p>Usuario: ${esc(username)}</p></div></div>
          <div class="card__body">
            <div class="row-2">
              <label class="field"><span class="field__label">Contraseña actual</span><input type="password" id="pw-current" autocomplete="current-password"></label>
              <label class="field"><span class="field__label">Contraseña nueva</span><input type="password" id="pw-next" autocomplete="new-password" minlength="10">
                <span class="field__hint">Al menos 10 caracteres.</span></label>
            </div>
            <div><button type="submit" class="btn btn--ghost" id="pw-save">Cambiar contraseña</button></div>
          </div>
        </section>
      </form>
    </div>`;

  const form = $("#settings-form");
  form.addEventListener("input", () => (formDirty = true));

  const syncHero = () => {
    $("#hero-preview").src = assetURL(heroImage);
    const isDefault = heroImage === HERO_DEFAULT;
    $("#hero-note").textContent = isDefault
      ? "Se muestra la foto original de la fachada. Podés subir otra cuando quieras."
      : "Esta es la foto del local que se ve en el sitio.";
    $("#hero-reset").hidden = isDefault;
  };
  syncHero();

  $("#hero-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    toast("Subiendo la foto…");
    try {
      heroImage = await uploadImage(await resizeImage(file, 2000, 0.82), "site");
      formDirty = true;
      syncHero();
      toast("Foto subida. Tocá “Guardar datos” para publicarla.");
    } catch (err) {
      handleError(err.message ? err : new Error("No se pudo leer esa imagen. Probá con un JPG o PNG."));
    }
  });
  $("#hero-reset").addEventListener("click", () => {
    heroImage = HERO_DEFAULT;
    formDirty = true;
    syncHero();
  });

  form.addEventListener("click", (e) => {
    const test = e.target.closest("[data-test-link]");
    if (!test) return;
    const url = normalizeURL($(`#s-${test.dataset.testLink}`).value);
    if (url) window.open(url, "_blank", "noopener");
    else toast("Primero escribí el link.", true);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const val = (id) => $(`#s-${id}`).value.trim();
    const setError = (id, msg) => {
      const f = $(`#field-${id}`);
      f.classList.toggle("is-invalid", !!msg);
      const err = f.querySelector(".field__error");
      err.textContent = msg || "";
      err.hidden = !msg;
    };

    const whatsapp = val("whatsapp").replace(/\D/g, "");
    const waError = /^\d{10,15}$/.test(whatsapp) ? "" : "Tiene que tener entre 10 y 15 números, sin espacios. Ej: 5492326422390";
    setError("whatsapp", waError);
    if (waError) {
      $("#s-whatsapp").focus();
      return;
    }

    const next = {
      whatsapp,
      whatsappDisplay: val("whatsappDisplay"),
      address: val("address"),
      city: val("city"),
      hours: $("#s-hours").value,
      hoursShort: val("hoursShort"),
      mapEmbed: val("mapEmbed"),
      instagram: normalizeURL(val("instagram")),
      facebook: normalizeURL(val("facebook")),
      heroEyebrow: val("heroEyebrow"),
      heroTitle: val("heroTitle"),
      heroHighlight: val("heroHighlight"),
      heroText: val("heroText"),
      heroImage,
      brands: $("#s-brands").value.split("\n").map((l) => l.trim()).filter(Boolean)
    };

    try {
      const res = await busy($("#settings-save"), () => api("saveSettings", { settings: next }));
      db.settings = res.settings;
      formDirty = false;
      ["whatsapp", "instagram", "facebook", "mapEmbed"].forEach((k) => ($(`#s-${k}`).value = res.settings[k] || ""));
      toast("Datos guardados");
    } catch (err) {
      handleError(err);
    }
  });

  $("#password-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const current = $("#pw-current").value;
    const nextPw = $("#pw-next").value;
    if (nextPw.length < 10) {
      toast("La contraseña nueva tiene que tener al menos 10 caracteres.", true);
      $("#pw-next").focus();
      return;
    }
    try {
      await busy($("#pw-save"), () =>
        request(`${API}auth.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf || "" },
          body: JSON.stringify({ action: "changePassword", current, next: nextPw })
        })
      );
      $("#pw-current").value = "";
      $("#pw-next").value = "";
      defaultPassword = false;
      toast("Contraseña cambiada");
    } catch (err) {
      handleError(err);
    }
  });
}

function normalizeURL(value) {
  const v = value.trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/* =========================================================
   Respaldo
   ========================================================= */
function renderBackup(view) {
  view.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Respaldo</h1>
          <p>Descargá una copia de todo lo cargado, o recuperala desde un archivo.</p>
        </div>
      </div>
      <div class="backup-grid">
        <div class="notice notice--info">
          ${icon("message")}
          <span>La copia guarda productos, categorías y datos del negocio. Las fotos quedan en el servidor (carpeta <code>uploads</code>) y se respaldan con las copias automáticas de Hostinger.</span>
        </div>

        <section class="card">
          <div class="card__head"><h2>Descargar copia</h2></div>
          <div class="card__body">
            <p class="field__hint">Un archivo .json con todo el catálogo. Conviene bajar una antes de hacer cambios grandes.</p>
            <div><button type="button" class="btn btn--primary" id="export">${icon("download")} Descargar copia</button></div>
          </div>
        </section>

        <section class="card">
          <div class="card__head"><h2>Recuperar una copia</h2></div>
          <div class="card__body danger-zone">
            <p>Reemplaza todo lo cargado por el contenido del archivo.</p>
            <label class="btn btn--danger-ghost">${icon("upload")} Elegir archivo
              <input type="file" id="import" accept="application/json,.json" class="visually-hidden">
            </label>
          </div>
        </section>
      </div>
    </div>`;

  $("#export").addEventListener("click", async () => {
    try {
      await loadData(); // siempre lo último guardado en el servidor
    } catch (err) {
      handleError(err);
      return;
    }
    const blob = new Blob([JSON.stringify({ settings: db.settings, categories: db.categories, products: db.products }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `arecold-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Copia descargada");
  });

  $("#import").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    let data;
    try {
      data = JSON.parse(await file.text());
      if (!Array.isArray(data.categories) || !Array.isArray(data.products) || !data.settings) throw new Error("formato");
    } catch (err) {
      toast("Ese archivo no es una copia del panel. Elegí el .json que descargaste desde acá.", true);
      return;
    }
    const ok = await confirmDialog(
      "¿Reemplazar todo con esta copia?",
      `Trae ${data.products.length} productos y ${data.categories.length} categorías. Lo cargado ahora se pierde.`,
      "Reemplazar"
    );
    if (!ok) return;
    try {
      const res = await api("importBackup", { data });
      db.settings = res.data.settings;
      db.categories = res.data.categories;
      db.products = res.data.products;
      updateNavCount();
      toast("Copia recuperada");
    } catch (err) {
      handleError(err);
    }
  });
}

/* ---------- Inicio ---------- */
boot();
