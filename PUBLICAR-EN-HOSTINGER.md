# Publicar el sitio en Hostinger

Guía paso a paso para dejar Refrigeración Are-Cold online con su panel funcionando. Se hace una sola vez; para actualizaciones posteriores ver el final.

**Qué necesita el plan:** PHP 8.0 o más nuevo y una base MySQL (cualquier plan de hosting web de Hostinger los trae).

---

## 1. Crear la base de datos

1. hPanel → **Bases de datos → Bases de datos MySQL**.
2. Creá una base y un usuario (por ejemplo `arecold`). Hostinger les agrega un prefijo: quedan como `u123456789_arecold`.
3. Anotá tres datos: **nombre de la base**, **usuario** y **contraseña**. El servidor es `localhost`.

## 2. Revisar PHP

hPanel → **Avanzado → Configuración de PHP**:
- Versión **8.0 o superior** (8.2 recomendada).
- Extensiones activas: `pdo_mysql`, `fileinfo`, `mbstring` y, si está disponible, `gd` (con `gd` las fotos subidas se re-generan y se achican en el servidor; sin `gd` igual funciona).

## 3. Subir los archivos

Con el **Administrador de archivos** (o FTP), subí todo el contenido de la carpeta del proyecto a `public_html`, **menos**:
- la carpeta `.git`
- los `.md` (no hace falta subirlos; igual el `.htaccess` los bloquea si quedan)

Tienen que quedar subidos los `.htaccess` (de la raíz, de `api/`, `api/lib/` y `uploads/`): son los que protegen las contraseñas y la carpeta de fotos. Algunos programas de FTP ocultan los archivos que empiezan con punto; activá "mostrar archivos ocultos".

## 4. Configurar la conexión

1. En `public_html/api/`, copiá `config.sample.php` y renombrá la copia como **`config.php`**.
2. Editalo y completá:
   - `name`, `user`, `password` con los datos del paso 1.
   - `setup_key`: una frase larga cualquiera (la vas a escribir una sola vez en el paso 6).
3. Guardá.

## 5. Activar HTTPS

hPanel → **Seguridad → SSL** → activá el certificado gratuito para el dominio. El ingreso al panel usa cookies seguras: sin HTTPS no conviene usarlo.

## 6. Cargar la base (elegí una de las dos opciones)

### Opción A — Importar el archivo .sql (sin instalador)

1. hPanel → **Bases de datos → phpMyAdmin** → entrá a la base del paso 1.
2. Pestaña **Importar** → elegí `sql/arecold-base-inicial.sql` (está en la carpeta del proyecto; no hace falta subirlo al hosting) → **Importar**.
3. Entrá a `https://TU-DOMINIO/admin/` con usuario **`admin`** y contraseña **`arecold-cambiar-2026`**, y cambiala enseguida en *Datos del negocio → Tu cuenta* (el panel lo recuerda con un aviso).

Trae las 14 categorías, sus subcategorías, los datos del negocio y los 27 productos de ejemplo. Si se importa dos veces por error, no se duplica nada. Con esta opción podés borrar `api/install.php` del servidor directamente.

### Opción B — Instalador

1. Entrá a `https://TU-DOMINIO/api/install.php`.
2. Completá la clave de instalación (`setup_key`), el usuario y la contraseña del panel (mínimo 10 caracteres).
3. Elegí si cargar los **productos de ejemplo**. Las categorías, subcategorías y datos del negocio se cargan siempre.
   - Si el catálogo real se va a cargar de cero, destildá la opción.
4. Tocá **Instalar**.

Después de instalar, la página ya no hace nada (queda bloqueada al existir un administrador), pero igual **borrá `api/install.php`** desde el Administrador de archivos.

## 7. Probar

- `https://TU-DOMINIO/` → el sitio con el catálogo.
- `https://TU-DOMINIO/admin/` → el panel. Ingresá con el usuario creado en el paso 6.
- Subí una foto a un producto, guardá y abrí el sitio desde el celular: se tiene que ver.

---

## Actualizar el sitio más adelante

- Subí solo los archivos que cambiaron.
- **Nunca pises** `api/config.php` (tiene las contraseñas) ni la carpeta `uploads/` (son las fotos que cargó el cliente).
- Si un cambio agrega tablas o columnas, va a venir con instrucciones propias. Hoy no hace falta tocar la base a mano.

## Respaldos

- **Datos:** panel → Respaldo → *Descargar copia* (productos, categorías y datos del negocio en un `.json`).
- **Fotos:** viven en `public_html/uploads/`. Entran en las copias automáticas de Hostinger (hPanel → Archivos → Copias de seguridad).

## Si algo falla

| Síntoma | Qué revisar |
|---|---|
| Arriba del sitio dice "Vista con datos de ejemplo" | El sitio no encuentra la base y muestra el catálogo de muestra para no verse vacío. Revisar que `api/config.php` exista y tenga bien los datos, y que se haya importado el `.sql` o corrido `install.php`. El panel muestra el motivo exacto al entrar |
| El panel dice "No se pudo conectar a la base de datos" | Nombre de base, usuario y contraseña en `api/config.php` (con el prefijo `u123…_`). El panel nunca muestra datos de ejemplo |
| "Hubo demasiados intentos fallidos" en el panel | Esperar 15 minutos (protección contra quien prueba contraseñas) |
| Las fotos no suben | Permisos de la carpeta `uploads/` (755) y que la foto no pase los 8 MB |
| Se olvidó la contraseña del panel | Volver a subir `api/install.php` y abrirlo: con el sitio ya instalado, solo ofrece **restablecer la contraseña** (pide la clave de instalación de `config.php`; no toca productos ni datos). Después, borrarlo otra vez |

## Probar en la computadora (opcional, para desarrollo)

Con XAMPP: creá una base desde phpMyAdmin, armá `api/config.php` con esos datos y corré, desde la carpeta del proyecto:

```
php -S 127.0.0.1:8090 -t .
```

Después importá `sql/arecold-base-inicial.sql` (o abrí `http://127.0.0.1:8090/api/install.php`). Si abrís los `.html` con doble clic, el sitio se ve con los datos de ejemplo y un aviso arriba; el panel necesita PHP sí o sí.

Si cambia la estructura de las tablas o los datos de ejemplo, regenerá el `.sql` con `php sql/generar.php`.
