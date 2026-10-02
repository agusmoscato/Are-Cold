# Are-Cold — guía rápida para modificar el sitio

Mapa "quiero cambiar X → tengo que tocar Y", para seguir editando sin releer todo el proyecto.

**Versión final:** sitio + panel con backend real (PHP + MySQL en Hostinger). Para publicarlo, ver `PUBLICAR-EN-HOSTINGER.md`. En local: `php -S 127.0.0.1:8090 -t .`. Abierto con doble clic, el sitio se ve con los datos de ejemplo (ver "Fallback sin base").

---

## Estructura

```
index.html, catalogo.html,      Páginas públicas
nosotros.html, contacto.html
admin/                          Panel (index.html + admin.css + admin.js), habla con api/
api/
  data.php                      Datos públicos. ?format=js → define window.AECOLD_SERVER (lo cargan las páginas)
  auth.php                      Ingreso, salida y cambio de contraseña del panel
  admin.php                     Acciones del panel (guardar productos, categorías, datos, subir fotos, respaldo)
  install.php                   Instalación única; después solo restablece la contraseña. Borrar del servidor tras usarlo
  config.sample.php             Plantilla → copiar como config.php (NO va a Git)
  lib/bootstrap.php             Conexión, sesión, CSRF, respuestas JSON
  lib/repo.php                  Lectura/escritura del catálogo con todas las validaciones
  lib/schema.sql                Tablas
uploads/                        Fotos subidas desde el panel (NO van a Git; .htaccess impide ejecutar scripts)
data/datos-de-ejemplo.js        DATOS DE EJEMPLO (única copia): fallback sin base, install.php y sql/generar.php
sql/arecold-base-inicial.sql    Estructura + datos de ejemplo + admin de prueba, para importar en phpMyAdmin
sql/generar.php                 Regenera el .sql (php sql/generar.php). La carpeta sql/ no se sirve por web
sql/importar-lote.js            Carga de catálogo real: node sql/importar-lote.js <paquete> → genera sql/catalogo-lote1.sql y copia fotos a uploads/products/catalogo y uploads/brands
css/styles.css                  Diseño del sitio. Al final: bloques "FASE 2" y "VERSIÓN FINAL"
js/icons.js                     Íconos (se inyectan en cada página y en el panel)
js/store.js                     Lee window.AECOLD_SERVER + helpers + lista "Mi cotización"
js/layout.js                    Header con mega-menú, menú móvil, footer, panel de cotización, modal
js/main.js                      Menús, galería, botones "Agregar a cotización"
js/home.js                      Hero (foto del local + categorías destacadas), grilla de categorías, marcas
js/catalog.js                   Catálogo: barra lateral / panel de filtros, búsqueda, grilla
assets/fachada-local.jpg        Foto real de la fachada (fondo del hero por defecto; se cambia desde el panel)
assets/productos/               Fotos de stock por categoría para los productos de ejemplo
```

**Caché (importante al publicar cambios):** el CDN de Hostinger guarda CSS y JS por 7 días. Por eso todas las rutas llevan `?v=AAAAMMDDNN` (en los 4 HTML y en `admin/index.html`). **Cada vez que cambies un `.css` o un `.js`, subí ese número en todos esos archivos** (buscar y reemplazar `?v=`); si no, quien ya entró al sitio va a seguir viendo la versión vieja. Los `.html` se revalidan siempre (regla en `.htaccess`).

Orden de scripts en cada página: `api/data.php?format=js` → (si no hay datos) `data/datos-de-ejemplo.js` → `js/icons.js` → `js/store.js` → `js/layout.js` → `js/main.js` → script de la página.

---

## Cómo viajan los datos

- **Sitio público:** `api/data.php?format=js` devuelve los productos visibles, categorías y datos del negocio como un script. Tiene caché de 60 segundos: un cambio del panel puede tardar hasta un minuto en verse.
- **Panel:** ingresa con `api/auth.php` (sesión PHP, cookie httponly). Lee todo con `admin.php?action=data` y guarda acción por acción. Cada POST lleva el encabezado `X-CSRF-Token`.
- **Fotos:** el navegador las achica (máx. 1600 px, JPG) y las sube con `action=upload`. El servidor valida que sean imágenes reales y, si tiene GD, las vuelve a generar. Se guardan en `uploads/<products|categories|site>/AAAA/MM/`. Cuando se quita o se reemplaza una foto, el archivo se borra si nadie más lo usa. Las de `assets/` nunca se borran.
- **Categorías:** el panel manda la lista completa en orden y el servidor la reconcilia. No deja borrar una categoría con productos, y al borrar una subcategoría sus productos quedan sin subcategoría.
- **Fallback sin base (solo sitio público):** si falta `api/config.php`, la base no conecta o no tiene tablas, `api/data.php` sirve `data/datos-de-ejemplo.js` con `demo: true`. Si el sitio se abre sin PHP, cada página carga ese archivo sola (script en línea después de `api/data.php`). En ambos casos `js/layout.js` muestra arriba "Vista con datos de ejemplo" y la consola explica el motivo. **El panel nunca usa ese fallback:** `auth.php` revisa la base (`db_problem()`) y el panel muestra el error en pantalla.
- **Usuario de prueba del .sql:** `admin` / `arecold-cambiar-2026`. Si se ingresa con esa contraseña, el panel muestra un aviso hasta que se cambie (`SQL_DEFAULT_PASSWORD` en `api/auth.php`, igual que en `sql/generar.php`).
- Lo único que se guarda en el navegador es la lista "Mi cotización" de cada visitante (`localStorage`, `arecold:quote`).

Seguridad incluida: contraseñas con `password_hash`, bloqueo de 15 min tras 8 intentos fallidos por IP, CSRF, cierre de sesión por inactividad (8 h, configurable), validación de rutas de fotos (solo `assets/` o `uploads/`), mapa limitado a `google.com/maps/embed`, `.htaccess` que bloquean `api/lib/`, `config.php`, los `.md` y la ejecución de scripts en `uploads/`.

---

## Esquema (tablas)

`admins`, `login_attempts`, `settings` (clave → valor JSON), `categories` (slug único, posición, highlight), `subcategories` (por categoría), `products` (id texto, FK a categoría/subcategoría, `price` VARCHAR(12), `active`, `features` JSON), `product_images` (ruta + posición).

Lo que devuelve la API (y usa el front) tiene la misma forma que `data/datos-de-ejemplo.js`:
- `settings`: whatsapp, whatsappDisplay, email, address, city, hours, hoursShort, instagram, facebook, mapEmbed, heroEyebrow, heroTitle, heroHighlight, heroText, heroImage, brands (lista de {name, logo})
- `categories[]`: slug, name, icon, image, highlight, subcategories[{slug, name}]
- `products[]`: id, name, category, subcategory, tag, price (solo dígitos, "" = consultar), active, description, features[], images[]

Para sumar un dato del negocio nuevo: agregarlo a `SETTINGS_KEYS` y a `save_settings()` en `api/lib/repo.php`, al formulario en `renderSettings()` de `admin/admin.js` y, si va en la semilla, a `data/datos-de-ejemplo.js` (después correr `php sql/generar.php`).

---

## Cambios más comunes

| Quiero… | Dónde |
|---|---|
| Productos, fotos, dar de baja | Panel → Productos |
| Categorías, subcategorías, cuáles van destacadas en el hero | Panel → Categorías |
| WhatsApp, dirección, horarios, mapa, redes, textos del hero, marcas, **foto del local** | Panel → Datos del negocio |
| Contraseña del panel | Panel → Datos del negocio → Tu cuenta (si se perdió: ver `PUBLICAR-EN-HOSTINGER.md`) |
| Mensaje de "Pedir cotización por WhatsApp" | `quoteMessage()` en `js/store.js` |
| Colores / tipografías del sitio | `:root` de `css/styles.css` (+ `<link>` de Google Fonts en cada HTML) |
| Qué categorías ocupan dos columnas en la grilla del inicio | `wide` en `renderCategoryShowcase()` (`js/home.js`) |
| Agregar un ícono | `<symbol id="icon-…">` en `js/icons.js`; para categorías, también en `CATEGORY_ICONS` (`admin/admin.js`) |
| Tamaño máximo de fotos / tiempo de sesión | `api/config.php` |

Los datos del negocio aparecen en el HTML mediante atributos: `data-setting="address"`, `data-setting-lines="hours"`, `data-href="instagram|facebook|maps"`, `data-map-embed` (iframe). Los textos de Nosotros, Contacto y el bloque Repuestos siguen escritos en cada HTML.

---

## Pendiente con el cliente
Ver `DECISIONES-DISENO.md`, sección "Pendientes".

---

## Datos de ejemplo vs. datos reales

- **Árbol de categorías** (`#arbol` en el panel): vista anidada con cantidad de productos; renombra y elimina con la misma acción `saveCategories`.
- Los productos de ejemplo tienen ids `p01`…`p27` (`data/datos-de-ejemplo.js`). El catálogo real usa ids con el slug de marca (`ormay-…`, `kohinoor-…`). **Todo dato de prueba nuevo debe llevar el prefijo `demo-` en el id** para poder limpiarlo con `DELETE FROM products WHERE id LIKE 'demo-%'`.
- `node sql/limpiar-datos-demo.js` genera `sql/limpiar-datos-demo.sql` (borra solo lo que coincide en id y nombre con los datos de ejemplo). Los importadores de lotes reales (`sql/importar-lote.js`) no cargan datos de ejemplo.
