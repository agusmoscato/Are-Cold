# Are-Cold — guía rápida para modificar la demo

Esto es un mapa "quiero cambiar X → tengo que tocar Y". Pensado para que vos (o yo en otra sesión) puedan seguir editando sin tener que releer todo el proyecto.

No hay build ni servidor: se edita el archivo y se refresca el navegador.

---

## Estructura del proyecto

```
index.html          Inicio
catalogo.html        Catálogo (filtros + buscador)
nosotros.html         Nosotros / Local
contacto.html         Contacto
css/styles.css        TODO el diseño (colores, tipografías, layout)
js/main.js             Header, menú, buscador, WhatsApp, modal de producto
js/home.js              Renderiza ofertas / categorías / destacados en Inicio
js/catalog.js            Renderiza y filtra la grilla del Catálogo
data/products.js          Los productos y las categorías (la única fuente de datos)
data/products.json         Mismo contenido en JSON, solo como referencia para el día de conectar una API
assets/logo-arecold.png     Logo del cliente
assets/icons.svg              Set de íconos (referencia; en cada HTML están embebidos igual, ver abajo)
assets/productos/                Fotos de stock genéricas por categoría (no son fotos reales, ver DECISIONES-DISENO.md)
DECISIONES-DISENO.md            Resumen de decisiones de diseño + placeholders pendientes
```

⚠️ **Los íconos SVG están duplicados dentro de cada HTML** (dentro de `<svg class="icon-sprite">` al principio del `<body>`), no se cargan desde `assets/icons.svg`. Es así a propósito: si se cargaran desde un archivo aparte, no funcionarían al abrir el sitio con doble clic (los navegadores bloquean eso por seguridad). Si agregás un ícono nuevo, hay que pegarlo en el `<svg class="icon-sprite">` de **cada** página que lo use.

---

## Cambios más comunes

### Agregar / editar / borrar un producto
Editá **`data/products.js`** (es el único lugar; no toques `products.json`, es solo referencia). Cada producto es un objeto:

```js
{
  "id": "p20",                          // único, no repetir
  "name": "Nombre del producto",
  "category": "heladeras",              // debe ser un slug que exista en categories
  "tag": "oferta",                      // "oferta" | "destacado" | "nuevo" | "" (vacío = sin etiqueta)
  "description": "Texto de la ficha ampliada.",
  "features": ["Característica 1", "Característica 2"]
}
```
Se guarda, se refresca el navegador y ya aparece en Inicio (si tiene tag) y en el Catálogo.

### Agregar / renombrar una categoría
También en `data/products.js`, arriba de todo, en `categories`. Cada categoría necesita un ícono (`icon`) que exista como `<symbol id="icon-...">` en el sprite. Si es una categoría nueva sin ícono creado, hay que dibujar uno nuevo en el sprite (mismo estilo: `stroke="currentColor" stroke-width="1.75"`, sin relleno) y pegarlo en el `<svg class="icon-sprite">` de `index.html` y `catalogo.html`.

### Cambiar colores (paleta)
Todo en **`css/styles.css`**, arriba de todo, dentro de `:root { ... }`. Los nombres son claros: `--blue-600` / `--blue-500` son el azul del logo, `--accent` es el naranja de ofertas y CTAs, `--ink` es el azul oscuro del header/footer. Cambiás el valor hexadecimal y se actualiza en todo el sitio (son variables CSS, no hay que buscar y reemplazar en cada componente).

### Cambiar tipografías
Dos lugares:
1. El `<link>` de Google Fonts en el `<head>` de cada HTML (buscá `fonts.googleapis.com`).
2. Las variables `--font-display` y `--font-body` en `css/styles.css` (arriba de todo).
Hay que cambiar los dos consistentemente.

### Cambiar el número de WhatsApp
Un solo lugar: `js/main.js`, primera línea, `const WHATSAPP_NUMBER = "5492326422390";`. Se usa en todos los botones de WhatsApp del sitio (no hay que tocar los HTML).

### Cambiar dirección / horarios
Están escritos directo en cada HTML (no hay un solo archivo central para esto, es texto de contenido). Se repite en: `index.html` (sección "Dónde estamos" + footer), `contacto.html`, `nosotros.html`, y el footer de `catalogo.html`. Buscá "Italia 727" o "Lunes a viernes" en cada archivo.

También está en el `<script type="application/ld+json">` de `index.html` (datos estructurados para SEO / Google) — si cambia la dirección u horario, actualizar ahí también.

### Cambiar el mapa / "Cómo llegar"
El botón linkea a `https://www.google.com/maps/search/?api=1&query=Italia+727`. Si confirman la ciudad, conviene agregarla a la query, ej: `query=Italia+727,+Chivilcoy`. Está en `index.html` y `contacto.html`.

### Cambiar redes sociales
Instagram y Facebook están hardcodeados como links (`<a href="https://instagram.com/...">`) en el header no, pero sí en las secciones "Dónde estamos" / footer de cada página. El link de Facebook quedó genérico (`facebook.com`) porque no tenía la URL real — reemplazar en cada archivo donde aparece.

### Reemplazar las fotos de stock por fotos reales de cada producto
Hoy `js/main.js` (`photoBlockHTML()`) muestra una foto de stock por categoría, tomada del mapa `CATEGORY_PHOTOS` (mismo archivo) y guardada en `assets/productos/<categoria>.jpg`. Son genéricas (banco Pexels), no el stock real, por eso llevan la etiqueta "Imagen ilustrativa". Cuando tengan fotos reales por producto, lo más simple es agregar un campo `"image": "assets/productos/nombre.jpg"` a cada producto en `data/products.js` y hacer que `photoBlockHTML()` priorice ese campo por sobre `CATEGORY_PHOTOS`. Avisame cuando tengan las fotos y lo hago.

### Textos generales (hero, "cómo comprar", "nosotros", etc.)
Son texto plano dentro de cada HTML, no hay un archivo de contenido separado. Se edita directo en el `.html` correspondiente, buscando el texto por palabras clave.

---

## Cosas a confirmar con el cliente antes de la versión final
(ver también `DECISIONES-DISENO.md`)
- URL real de Facebook
- Ciudad para que el mapa apunte exacto (asumí que la dirección alcanza, no puse ciudad)
- Fotos reales de productos y del local
- Confirmar si quieren cambiar el naranja de acento o el tono de los textos
- Cargar el catálogo completo (~200 productos) en `data/products.js` cuando lo tengan armado
