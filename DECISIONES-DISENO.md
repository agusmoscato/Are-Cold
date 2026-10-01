# Refrigeración Are-Cold — sitio web
Decisiones de diseño y estado del proyecto.

## Cómo verlo
Es la versión final: sitio público + panel con base de datos (PHP + MySQL en Hostinger). Para publicarlo, seguir `PUBLICAR-EN-HOSTINGER.md`; para probarlo en la computadora hace falta PHP (ver el final de esa guía). Ya no funciona abriendo los `.html` con doble clic.

Páginas: `index.html` (Inicio), `catalogo.html` (Catálogo con filtros y buscador), `nosotros.html` (Nosotros/Local), `contacto.html` (Contacto) y `admin/index.html` (panel de administración, ver Fase 2).

---

## 1. Decisiones de diseño

**Punto de partida: el logo.** Las palabras "REFRIGERACIÓN ARE-COLD" con el efecto de hielo goteando ya cuentan la historia del negocio: serio pero con un guiño de humor ("son frío"). Todo el sitio se armó para sostener ese tono, no para taparlo con una identidad corporativa genérica.

**Paleta.** Se construyó una escala completa a partir del azul real del logo (#3E6E9E / #4A7BA6): un azul oscuro casi tinta para el header y los fondos fuertes, azules medios para botones secundarios y fondos alternados, y un azul muy pálido para separar secciones sin usar gris. Como acento cálido (ofertas, botones principales, llamados a la acción) se eligió un **naranja quemado** (#E07A29): contrasta con el frío del producto y transmite la calidez de la atención, sin competir con el verde de WhatsApp, que se reservó únicamente para el botón de WhatsApp. Todo está definido como variables CSS al principio de `css/styles.css`, así se puede ajustar la paleta en vivo durante la reunión.

**Tipografías (2 familias, como pide el brief).**
- **Baloo 2** para títulos: es redondeada y de trazo grueso, dialoga directamente con las letras gruesas del logo sin copiarlas.
- **Plus Jakarta Sans** para texto y datos técnicos: muy legible, no es la típica Inter/Roboto por defecto.

**El hielo del logo, con moderación.** El recurso de escarcha aparece en el borde superior de la tarjeta de Aires acondicionados del hero y en el bloque de Repuestos; no se repite en cada tarjeta o sección (tal como pedía el brief).

**Estructura, no plantilla de e-commerce.** Se evitó a propósito la grilla de tarjetas idénticas como estructura general:
- La sección de categorías es una **grilla grande con foto** donde "Heladeras" y "Repuestos" ocupan dos columnas, no 14 cuadraditos iguales.
- Los íconos son un set propio, dibujados a mano con un solo grosor de trazo (no íconos de stock en círculos de colores).
- No hay textos de relleno, testimonios inventados ni cifras de trayectoria: el brief pidió explícitamente no inventar información del negocio, y así se hizo.

**Botón de WhatsApp en todos lados.** Header, menú móvil, la ficha ampliada ("Consultar solo este"), el formulario de contacto, el panel "Mi cotización" y un botón flotante fijo.

**Sin precios, en ningún lado.** Desde la Fase 2, cada producto se suma a "Mi cotización" y el pedido sale por WhatsApp con el listado completo (ver Fase 2).

---

## 2. Cómo está armado (para escalar después)

Todo el contenido (productos, fotos, categorías, datos del negocio) vive en la base de datos y se edita desde el panel; no hace falta tocar HTML ni CSS. Los datos de ejemplo viven en `data/datos-de-ejemplo.js`: se usan para instalar, para el archivo `sql/arecold-base-inicial.sql` y como respaldo visual si el sitio no encuentra la base. Detalle técnico en `MEMORY.md`.

Las páginas cargan los datos como script (`api/data.php?format=js`) y no con un `fetch()`, así el sitio arranca con el catálogo ya disponible, sin parpadeo de carga.

Los **27 productos de ejemplo** (opcionales al instalar) cubren las 14 categorías, con más variedad en Calefacción y Aires acondicionados, que son el foco actual.

---

## 3. Lo que quedó como placeholder o supuesto

- **Fotos de producto:** los productos de ejemplo usan fotos de stock genéricas (banco Pexels, libres de uso comercial), una por categoría, marcadas "Imagen ilustrativa" — no son fotos reales del stock del cliente. Las fotos reales se suben desde el panel (varias por producto); esas no llevan la etiqueta. Un producto sin fotos muestra el bloque con ícono.
- **Año del footer:** se calcula solo con el año actual.
- **Dominio:** el sitio no referencia ningún dominio propio todavía, ya que `refrigeracionarecold` aún no está registrado.
- **Formulario de contacto:** arma un link de WhatsApp con los datos cargados (no envía mail ni guarda en ninguna base). Es el comportamiento esperado para esta etapa, según el brief.
- **Cantidad de productos:** 27 de muestra sobre los ~200 reales que tendrá el catálogo final.

---

## 4. Fase 2 — lo que se sumó

**El objetivo cambió de "consultar" a "cotizar".** El cliente no vende online, así que el sitio ahora lleva a la persona a armar una selección y mandarla por WhatsApp de una sola vez:
- Cada producto tiene **"Agregar a cotización"** (tarjeta y ficha). El header muestra **"Mi cotización"** con un contador.
- El panel lateral lista lo elegido (foto, nombre, categoría, sin precios), permite quitar ítems y termina en **"Pedir cotización por WhatsApp"**, que abre el chat con el mensaje armado con todos los productos.
- La lista queda guardada en el navegador mientras la persona sigue mirando.

**Calefacción y Aires acondicionados, primero.** El hero ahora tiene dos tarjetas grandes, una cálida (naranja, con llama) y una fría (azul, con el borde de hielo del logo), desfasadas como dos estaciones. Cada una lleva accesos directos a sus subcategorías. Es el elemento distintivo de esta fase y retoma la idea de marca "frío para el producto, calidez en la atención". Qué dos categorías se destacan se elige desde el panel.

**Inicio reordenado.** Hero → grilla grande de categorías con foto → tira de marcas → Repuestos → "Cómo pedir tu cotización" (3 pasos) → Dónde estamos. Se sacaron "Productos destacados" y también el carrusel de "Ofertas y destacados", porque no estaba en el orden nuevo que pidió el cliente; las etiquetas Oferta/Destacado/Nuevo se siguen viendo sobre las fotos en el catálogo.

**Subcategorías.** Segundo nivel en 8 de las 14 categorías (Calefacción, Aires, Heladeras, Freezer, Lavarropas, Cocción, Termotanques y Repuestos, este último por tipo de equipo). El resto quedó sin subdividir a propósito. Se ven en el mega-menú del header (al pasar por "Categorías" aparecen los 14 rubros, y al pasar por uno, sus subcategorías), en el menú móvil como acordeón, y en el catálogo como un segundo filtro "Tipo".

**Galería de fotos.** Cada producto admite varias fotos: la ficha muestra la principal con flechas, contador y miniaturas (también se desliza con el dedo); la tarjeta usa solo la primera. Con una sola foto no aparecen controles.

**Panel de administración (`admin/`).** Herramienta interna con estética neutra, pensada para notebook:
- **Productos:** listado con buscador y filtros por categoría y estado; alta y edición con nombre, categoría, subcategoría, descripción, características (lista editable), varias fotos (subir, reordenar arrastrando o con flechas, elegir principal) y etiqueta.
- **Dar de baja vs. eliminar:** el interruptor "Visible" oculta el producto del sitio sin borrarlo (se puede reactivar). Eliminar borra para siempre, con confirmación.
- **Categorías:** agregar, renombrar, reordenar, cambiar ícono y foto, destacar en el inicio, y lo mismo con las subcategorías. Una categoría con productos no se puede borrar hasta vaciarla.
- **Datos del negocio:** WhatsApp, dirección, ciudad, horarios, Instagram, Facebook (con botón "Probar link"), textos del hero y marcas.
- **Respaldo:** descargar y recuperar una copia completa.

**Alcance del panel.** Un solo usuario administrador, sin pedidos, estadísticas ni roles, según lo acordado.

## 5. Versión final — lo que cambió

**Backend real.** El panel ya no guarda en el navegador: usa PHP + MySQL en el hosting de Hostinger que el cliente ya tiene contratado. Se eligió así para que todo (sitio, base y fotos) quede en un solo lugar, sin servicios externos ni costos extra.
- **Ingreso real:** usuario y contraseña validados en el servidor (contraseña cifrada, nunca escrita en el código). Bloqueo temporal tras varios intentos fallidos, cierre por inactividad y cambio de contraseña desde el panel.
- **Lo que carga Antonella o Carlos lo ve cualquier visitante**, desde cualquier dispositivo (con hasta un minuto de demora por caché).
- **Fotos en el servidor:** se achican en el navegador antes de subir (rápido desde el celular), el servidor verifica que sean imágenes reales y las guarda en `uploads/`. Al quitar una foto, el archivo se borra.
- **Instalación guiada** (`api/install.php`): crea las tablas, el usuario y carga los datos iniciales. Pide una clave definida en `config.php`, así nadie puede instalar antes que el dueño.

**Hero con la foto del local.** El fondo del inicio es ahora una fachada con un velo azul oscuro que mantiene el contraste del texto. Mientras no esté la foto real se usa una **foto de referencia**: una esquina comercial de San Antonio de Areco (autor Tjeerd, licencia CC BY 2.0, por eso aparece su crédito en un costado). **No es el local de Are-Cold.** La foto real se sube desde el panel → Datos del negocio → *Foto del local*; al cambiarla, el crédito desaparece solo.

**Marcas debajo del hero.** Orden del inicio: Hero → Marcas → Elegí por dónde empezar → Repuestos → Cómo pedir tu cotización → Dónde estamos.

**Mapa real.** "Dónde estamos" muestra el mapa de Google de Italia 727, San Antonio de Areco (el iframe que pasó el cliente). Se puede cambiar desde el panel pegando el código de "Compartir → Insertar un mapa". El botón "Cómo llegar" pasó a la tarjeta de datos para no tapar los controles del mapa.

**Ciudad confirmada.** San Antonio de Areco: está en el título del sitio, en los datos para Google y en el botón "Cómo llegar".

**Filtros del catálogo rediseñados.** Se sacó la fila de chips con scroll horizontal:
- **Escritorio:** lista vertical de categorías a la izquierda (fija al hacer scroll). Al elegir una, se despliegan debajo sus subcategorías.
- **Celular:** una barra fija con buscador y botón "Categorías" abre un panel desde abajo, con opciones grandes para el pulgar y un botón "Ver N productos".
- **Selección activa marcada por forma y peso, no solo por color:** la categoría activa va con fondo lleno, negrita y tilde, y la subcategoría con barra lateral, negrita y tilde.
- Arriba de la grilla, los filtros activos aparecen como etiquetas que se quitan con un toque (bajan de renglón, sin scroll lateral).
- Mismos radios, tipografías y colores que el resto del sitio.

**Sin base conectada, el sitio no se ve roto.** Si todavía no se configuró la base (o se cae), el sitio público muestra el catálogo de ejemplo con un aviso arriba: "Vista con datos de ejemplo: la base de datos todavía no está conectada". Lo mismo pasa si se abre con doble clic, útil para revisiones rápidas. El panel, en cambio, nunca muestra datos de ejemplo: avisa en pantalla qué falta ("No se pudo conectar a la base de datos, revisá `api/config.php`", "faltan las tablas", etc.).

**Carga manual con .sql.** `sql/arecold-base-inicial.sql` deja la base lista desde phpMyAdmin, sin pasar por el instalador: estructura, categorías, datos del negocio, productos de ejemplo y un usuario de prueba (`admin` / `arecold-cambiar-2026`). El panel pide cambiar esa contraseña mientras se siga usando.

## 6. Pendientes con el cliente

- **Instagram y Facebook:** confirmar con Antonella el usuario correcto de Instagram y la página correcta de Facebook. Los cargados (`instagram.com/refigeracion.arecold`, `facebook.com/RefrigeracionArecold`) no están verificados, y el de Instagram dice "refigeracion", sin la primera r. Se cambian desde el panel → Datos del negocio.
- **Foto real del local** (fachada, horizontal) para reemplazar la de referencia del hero.
- **Marcas reales:** la tira usa "Marca 1… Marca 8". Falta la lista real y, si se quieren como imagen, los logos.
- **Catálogo real:** hoy existe solo como PDF por WhatsApp. Se carga producto por producto desde el panel una vez publicado.

---

Sitio desarrollado por **Moscode** (moscode.com.ar).
