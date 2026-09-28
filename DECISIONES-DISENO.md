# Refrigeración Are-Cold — demo web
Notas para la reunión con el cliente.

## Cómo abrir la demo
Abrir `index.html` haciendo doble clic (funciona sin servidor ni instalación). También se puede publicar la carpeta completa en cualquier hosting estático (no necesita build).

Páginas: `index.html` (Inicio), `catalogo.html` (Catálogo con filtros y buscador), `nosotros.html` (Nosotros/Local), `contacto.html` (Contacto).

---

## 1. Decisiones de diseño

**Punto de partida: el logo.** Las palabras "REFRIGERACIÓN ARE-COLD" con el efecto de hielo goteando ya cuentan la historia del negocio: serio pero con un guiño de humor ("son frío"). Todo el sitio se armó para sostener ese tono, no para taparlo con una identidad corporativa genérica.

**Paleta.** Se construyó una escala completa a partir del azul real del logo (#3E6E9E / #4A7BA6): un azul oscuro casi tinta para el header y los fondos fuertes, azules medios para botones secundarios y fondos alternados, y un azul muy pálido para separar secciones sin usar gris. Como acento cálido (ofertas, botones principales, llamados a la acción) se eligió un **naranja quemado** (#E07A29): contrasta con el frío del producto y transmite la calidez de la atención, sin competir con el verde de WhatsApp, que se reservó únicamente para el botón de WhatsApp. Todo está definido como variables CSS al principio de `css/styles.css`, así se puede ajustar la paleta en vivo durante la reunión.

**Tipografías (2 familias, como pide el brief).**
- **Baloo 2** para títulos: es redondeada y de trazo grueso, dialoga directamente con las letras gruesas del logo sin copiarlas.
- **Plus Jakarta Sans** para texto y datos técnicos: muy legible, no es la típica Inter/Roboto por defecto.

**El hielo del logo, con moderación.** El recurso de escarcha aparece una sola vez, como borde superior del panel visual del hero, y no se repite en cada tarjeta o sección (tal como pedía el brief).

**Estructura, no plantilla de e-commerce.** Se evitó a propósito la grilla de tarjetas idénticas como estructura general:
- La sección de categorías es un **mosaico asimétrico** (dos categorías más grandes, "Heladeras" y "Repuestos", el resto en tamaño estándar), no 14 cuadraditos iguales.
- Los íconos son un set propio, dibujados a mano con un solo grosor de trazo (no íconos de stock en círculos de colores).
- No hay textos de relleno, testimonios inventados ni cifras de trayectoria: el brief pidió explícitamente no inventar información del negocio, y así se hizo.

**Botón de WhatsApp en todos lados.** Header, menú móvil, cada tarjeta de producto, la ficha ampliada, el formulario de contacto y un botón flotante fijo. El mensaje precargado cambia según el producto consultado.

**Sin precios, en ningún lado.** Cada producto dice "Consultar" y linkea a WhatsApp con el mensaje: *"Hola! Quería consultar por [producto]. ¿Tienen disponibilidad y cuál es el precio?"*.

---

## 2. Cómo está armado (para escalar después)

Todo el catálogo sale de **un único archivo**, `data/products.js` (mismo esquema documentado en `data/products.json` para el día que se conecte a una API o panel). Cargar los ~200 productos reales es reemplazar ese archivo; no hay que tocar el HTML ni el CSS.

Se eligió cargar los datos como script (`products.js`) y no con `fetch()` de un `.json`, porque así la demo funciona abriendo el archivo directo desde la carpeta, sin necesitar un servidor (los navegadores bloquean `fetch` a archivos locales por seguridad).

La demo trae **19 productos de ejemplo** repartidos en las 14 categorías (el brief pedía entre 14 y 18; se sumó uno extra en Repuestos para mostrar variedad en ese rubro).

---

## 3. Lo que quedó como placeholder o supuesto

- **Fotos de producto:** son bloques con ícono de la categoría y la etiqueta "Foto del producto", no imágenes reales (todavía no las tenemos). Estructuralmente están listos para reemplazar por fotos: cada tarjeta usa el mismo componente visual, así que cargar las fotos reales es un cambio centralizado.
- **Logo del footer / redes:** el link de Facebook queda genérico (`facebook.com`) porque no se pasó la URL exacta de la página; hay que reemplazarlo por el link real.
- **Mapa:** el bloque "Cómo llegar" linkea a Google Maps buscando "Italia 727" por texto. No se fijó una ciudad porque no se especificó; conviene confirmarla para que el mapa apunte exacto.
- **Año del footer:** puesto en 2026 (fecha de esta demo). Ajustar si se publica más adelante.
- **Dominio:** el sitio no referencia ningún dominio propio todavía, ya que `refrigeracionarecold` aún no está registrado.
- **Formulario de contacto:** en esta demo arma un link de WhatsApp con los datos cargados (no envía mail ni guarda en ninguna base). Es el comportamiento esperado para esta etapa, según el brief.
- **Cantidad de productos:** 19 de muestra sobre los ~200 reales que tendrá el catálogo final.

---

Demo desarrollada por **Moscode** (moscode.com.ar).
