<?php
/* Lectura y escritura del catálogo. Todo lo que llega del panel se valida acá. */

declare(strict_types=1);

const SETTINGS_KEYS = [
    'whatsapp', 'whatsappDisplay', 'address', 'city', 'hours', 'hoursShort',
    'instagram', 'facebook', 'mapEmbed',
    'heroEyebrow', 'heroTitle', 'heroHighlight', 'heroText', 'heroImage',
    'brands',
];
const PRODUCT_TAGS = ['', 'oferta', 'destacado', 'nuevo'];
const MAX_HIGHLIGHTED = 2;

/* Datos de EJEMPLO (data/datos-de-ejemplo.js). Los usan install.php, sql/generar.php y el
   fallback de data.php cuando no hay base. El archivo es "window.AECOLD_DEMO = {JSON};". */
function load_demo_data(): array
{
    $raw = (string) @file_get_contents(ROOT_DIR . '/data/datos-de-ejemplo.js');
    $data = null;
    // La asignación tiene que estar al comienzo de una línea (así no se confunde con el comentario)
    if (preg_match('/^window\.AECOLD_DEMO\s*=\s*/m', $raw, $m, PREG_OFFSET_CAPTURE)) {
        $start = $m[0][1] + strlen($m[0][0]);
        $end = strrpos($raw, '}');
        $data = $end > $start ? json_decode(substr($raw, $start, $end - $start + 1), true) : null;
    }
    if (!is_array($data) || !isset($data['categories'], $data['products'], $data['settings'])) {
        throw new ApiError('No se encontró data/datos-de-ejemplo.js (o está dañado). Subilo y probá de nuevo.', 500);
    }
    return $data;
}

/* Corre $fn dentro de una transacción; si ya hay una abierta (restaurar copia), se suma a esa */
function in_transaction(callable $fn)
{
    $pdo = db();
    if ($pdo->inTransaction()) {
        return $fn();
    }
    $pdo->beginTransaction();
    try {
        $result = $fn();
        $pdo->commit();
        return $result;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/* =========================================================
   Lectura
   ========================================================= */

/* Estructura que usa el sitio: { settings, categories[{..., subcategories}], products[{..., images}] } */
function get_data(bool $includeInactive): array
{
    $pdo = db();

    $settings = [];
    foreach ($pdo->query('SELECT name, value FROM settings') as $row) {
        $settings[$row['name']] = json_decode($row['value'], true);
    }

    $categories = [];
    $catById = [];
    foreach ($pdo->query('SELECT id, slug, name, icon, image, highlight FROM categories ORDER BY position, id') as $row) {
        $catById[$row['id']] = count($categories);
        $categories[] = [
            'slug'          => $row['slug'],
            'name'          => $row['name'],
            'icon'          => $row['icon'],
            'image'         => $row['image'],
            'highlight'     => (bool) $row['highlight'],
            'subcategories' => [],
        ];
    }
    foreach ($pdo->query('SELECT category_id, slug, name FROM subcategories ORDER BY position, id') as $row) {
        if (isset($catById[$row['category_id']])) {
            $categories[$catById[$row['category_id']]]['subcategories'][] = ['slug' => $row['slug'], 'name' => $row['name']];
        }
    }

    $images = [];
    foreach ($pdo->query('SELECT product_id, path FROM product_images ORDER BY position, id') as $row) {
        $images[$row['product_id']][] = $row['path'];
    }

    $sql = 'SELECT p.id, p.name, c.slug AS category, s.slug AS subcategory, p.tag, p.active, p.description, p.features
            FROM products p
            JOIN categories c ON c.id = p.category_id
            LEFT JOIN subcategories s ON s.id = p.subcategory_id'
        . ($includeInactive ? '' : ' WHERE p.active = 1')
        . ' ORDER BY p.created_at, p.id';
    $products = [];
    foreach ($pdo->query($sql) as $row) {
        $products[] = [
            'id'          => $row['id'],
            'name'        => $row['name'],
            'category'    => $row['category'],
            'subcategory' => $row['subcategory'] ?? '',
            'tag'         => $row['tag'],
            'active'      => (bool) $row['active'],
            'description' => $row['description'],
            'features'    => json_decode($row['features'], true) ?: [],
            'images'      => $images[$row['id']] ?? [],
        ];
    }

    return ['settings' => $settings, 'categories' => $categories, 'products' => $products];
}

/* =========================================================
   Validación
   ========================================================= */

function clean_text($value, int $max, string $label, bool $required = false): string
{
    $text = trim(str_replace(["\r\n", "\r"], "\n", (string) ($value ?? '')));
    if ($required && $text === '') {
        throw new ApiError("Falta completar: {$label}.");
    }
    if (mb_strlen($text) > $max) {
        throw new ApiError("“{$label}” es demasiado largo (máximo {$max} caracteres).");
    }
    return $text;
}

function valid_slug($value): string
{
    $slug = (string) $value;
    if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) || strlen($slug) > 80) {
        throw new ApiError('Hay un identificador de categoría inválido. Recargá la página.');
    }
    return $slug;
}

/* Solo se aceptan rutas a fotos propias del sitio: assets/... (las de ejemplo) o uploads/... (las subidas) */
function valid_asset_path($value): string
{
    $path = (string) ($value ?? '');
    if ($path === '') {
        return '';
    }
    if (strlen($path) > 255 || strpos($path, '..') !== false || !preg_match('#^(assets|uploads)/[A-Za-z0-9._/-]+\.(jpe?g|png|webp)$#i', $path)) {
        throw new ApiError('Una de las fotos tiene una ruta inválida. Volvé a subirla.');
    }
    return $path;
}

function valid_url($value, string $label): string
{
    $url = trim((string) ($value ?? ''));
    if ($url === '') {
        return '';
    }
    if (!preg_match('#^https?://#i', $url)) {
        $url = 'https://' . $url;
    }
    if (!filter_var($url, FILTER_VALIDATE_URL) || strlen($url) > 300) {
        throw new ApiError("El link de {$label} no es válido.");
    }
    return $url;
}

/* Acepta el iframe completo que da Google Maps ("Compartir → Insertar un mapa") o solo su link */
function valid_map_embed($value): string
{
    $raw = trim((string) ($value ?? ''));
    if ($raw === '') {
        return '';
    }
    if (preg_match('/src\s*=\s*["\']([^"\']+)["\']/i', $raw, $m)) {
        $raw = html_entity_decode($m[1]);
    }
    if (!preg_match('#^https://(www\.)?google\.[a-z.]+/maps/embed\?#i', $raw) || strlen($raw) > 2000) {
        throw new ApiError('El mapa tiene que ser el código de Google Maps de “Compartir → Insertar un mapa”.');
    }
    return $raw;
}

/* =========================================================
   Productos
   ========================================================= */

function new_product_id(): string
{
    return 'p' . base_convert((string) time(), 10, 36) . bin2hex(random_bytes(3));
}

function category_row(string $slug): array
{
    $st = db()->prepare('SELECT id FROM categories WHERE slug = ?');
    $st->execute([$slug]);
    $row = $st->fetch();
    if (!$row) {
        throw new ApiError('La categoría elegida ya no existe. Recargá la página.');
    }
    return $row;
}

/* $forceId: solo para restaurar copias, conserva el id original del producto nuevo.
   $returnProduct = false evita releer todo el catálogo (importaciones grandes). */
function save_product(array $in, ?string $forceId = null, bool $returnProduct = true): ?array
{
    $pdo = db();
    $id = (string) ($in['id'] ?? '');
    $isNew = $id === '';

    $name = clean_text($in['name'] ?? '', 160, 'Nombre', true);
    $cat = category_row(valid_slug($in['category'] ?? ''));

    $subId = null;
    $subSlug = (string) ($in['subcategory'] ?? '');
    if ($subSlug !== '') {
        $st = $pdo->prepare('SELECT id FROM subcategories WHERE category_id = ? AND slug = ?');
        $st->execute([$cat['id'], valid_slug($subSlug)]);
        $subId = $st->fetchColumn() ?: null;
    }

    $tag = (string) ($in['tag'] ?? '');
    if (!in_array($tag, PRODUCT_TAGS, true)) {
        $tag = '';
    }

    $features = [];
    foreach (array_slice((array) ($in['features'] ?? []), 0, 40) as $f) {
        $f = clean_text($f, 200, 'Característica');
        if ($f !== '') {
            $features[] = $f;
        }
    }

    $images = [];
    foreach (array_slice((array) ($in['images'] ?? []), 0, 20) as $p) {
        $p = valid_asset_path($p);
        if ($p !== '' && !in_array($p, $images, true)) {
            $images[] = $p;
        }
    }

    $fields = [
        'category_id'    => $cat['id'],
        'subcategory_id' => $subId,
        'name'           => $name,
        'tag'            => $tag,
        'active'         => !empty($in['active']) ? 1 : 0,
        'description'    => clean_text($in['description'] ?? '', 4000, 'Descripción'),
        'features'       => json_encode($features, JSON_UNESCAPED_UNICODE),
    ];

    $previousImages = [];
    in_transaction(function () use ($pdo, &$id, &$previousImages, $isNew, $forceId, $fields, $images) {
        if ($isNew) {
            $id = ($forceId !== null && preg_match('/^[a-z0-9]{1,40}$/i', $forceId) && !product_exists($forceId))
                ? $forceId
                : new_product_id();
            $st = $pdo->prepare('INSERT INTO products (id, category_id, subcategory_id, name, tag, active, description, features)
                                 VALUES (:id, :category_id, :subcategory_id, :name, :tag, :active, :description, :features)');
            $st->execute(['id' => $id] + $fields);
        } else {
            $st = $pdo->prepare('SELECT path FROM product_images WHERE product_id = ?');
            $st->execute([$id]);
            $previousImages = $st->fetchAll(PDO::FETCH_COLUMN);

            $st = $pdo->prepare('UPDATE products SET category_id = :category_id, subcategory_id = :subcategory_id, name = :name,
                                 tag = :tag, active = :active, description = :description, features = :features WHERE id = :id');
            $st->execute(['id' => $id] + $fields);
            if ($st->rowCount() === 0 && !product_exists($id)) {
                throw new ApiError('Ese producto ya no existe. Puede que lo hayan eliminado.', 404);
            }
            $pdo->prepare('DELETE FROM product_images WHERE product_id = ?')->execute([$id]);
        }
        $ins = $pdo->prepare('INSERT INTO product_images (product_id, path, position) VALUES (?, ?, ?)');
        foreach ($images as $i => $path) {
            $ins->execute([$id, $path, $i]);
        }
    });

    // Fotos que se quitaron: se borran del servidor si nadie más las usa
    foreach (array_diff($previousImages, $images) as $path) {
        delete_upload_if_unused($path);
    }

    if (!$returnProduct) {
        return null;
    }
    foreach (get_data(true)['products'] as $p) {
        if ($p['id'] === $id) {
            return $p;
        }
    }
    throw new ApiError('No se encontró el producto guardado.', 500);
}

function product_exists(string $id): bool
{
    $st = db()->prepare('SELECT 1 FROM products WHERE id = ?');
    $st->execute([$id]);
    return (bool) $st->fetchColumn();
}

function set_product_active(string $id, bool $active): void
{
    if (!product_exists($id)) {
        throw new ApiError('Ese producto ya no existe.', 404);
    }
    db()->prepare('UPDATE products SET active = ? WHERE id = ?')->execute([$active ? 1 : 0, $id]);
}

function delete_product(string $id): void
{
    $pdo = db();
    $st = $pdo->prepare('SELECT path FROM product_images WHERE product_id = ?');
    $st->execute([$id]);
    $paths = $st->fetchAll(PDO::FETCH_COLUMN);
    $pdo->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
    foreach ($paths as $path) {
        delete_upload_if_unused($path);
    }
}

/* =========================================================
   Categorías: el panel manda la lista completa, en orden
   ========================================================= */

function save_categories(array $list): array
{
    $pdo = db();
    if (count($list) > 60) {
        throw new ApiError('Demasiadas categorías.');
    }

    $clean = [];
    $seen = [];
    foreach ($list as $c) {
        $slug = valid_slug($c['slug'] ?? '');
        if (isset($seen[$slug])) {
            throw new ApiError('Hay dos categorías con el mismo identificador. Recargá la página.');
        }
        $seen[$slug] = true;
        $subs = [];
        $subSeen = [];
        foreach (array_slice((array) ($c['subcategories'] ?? []), 0, 40) as $s) {
            $subSlug = valid_slug($s['slug'] ?? '');
            if (isset($subSeen[$subSlug])) {
                continue;
            }
            $subSeen[$subSlug] = true;
            $subs[] = ['slug' => $subSlug, 'name' => clean_text($s['name'] ?? '', 120, 'Nombre de subcategoría', true)];
        }
        $clean[] = [
            'slug'          => $slug,
            'name'          => clean_text($c['name'] ?? '', 120, 'Nombre de categoría', true),
            'icon'          => preg_match('/^[a-z-]{1,40}$/', (string) ($c['icon'] ?? '')) ? $c['icon'] : 'box',
            'image'         => valid_asset_path($c['image'] ?? ''),
            'highlight'     => !empty($c['highlight']) ? 1 : 0,
            'subcategories' => $subs,
        ];
    }
    if (count(array_filter($clean, fn ($c) => $c['highlight'])) > MAX_HIGHLIGHTED) {
        throw new ApiError('Solo puede haber ' . MAX_HIGHLIGHTED . ' categorías destacadas en el inicio.');
    }

    $existing = [];
    foreach ($pdo->query('SELECT id, slug, image FROM categories') as $row) {
        $existing[$row['slug']] = $row;
    }

    $replacedImages = [];
    in_transaction(function () use ($pdo, $clean, $existing, $seen, &$replacedImages) {
        foreach ($clean as $pos => $c) {
            if (isset($existing[$c['slug']])) {
                $catId = (int) $existing[$c['slug']]['id'];
                if ($existing[$c['slug']]['image'] !== $c['image']) {
                    $replacedImages[] = $existing[$c['slug']]['image'];
                }
                $pdo->prepare('UPDATE categories SET name = ?, icon = ?, image = ?, highlight = ?, position = ? WHERE id = ?')
                    ->execute([$c['name'], $c['icon'], $c['image'], $c['highlight'], $pos, $catId]);
            } else {
                $pdo->prepare('INSERT INTO categories (slug, name, icon, image, highlight, position) VALUES (?, ?, ?, ?, ?, ?)')
                    ->execute([$c['slug'], $c['name'], $c['icon'], $c['image'], $c['highlight'], $pos]);
                $catId = (int) $pdo->lastInsertId();
            }

            // Subcategorías: actualizar, crear y borrar las que ya no están (sus productos quedan sin subcategoría)
            $st = $pdo->prepare('SELECT id, slug FROM subcategories WHERE category_id = ?');
            $st->execute([$catId]);
            $existingSubs = array_column($st->fetchAll(), 'id', 'slug');
            $keep = [];
            foreach ($c['subcategories'] as $subPos => $s) {
                if (isset($existingSubs[$s['slug']])) {
                    $pdo->prepare('UPDATE subcategories SET name = ?, position = ? WHERE id = ?')
                        ->execute([$s['name'], $subPos, $existingSubs[$s['slug']]]);
                } else {
                    $pdo->prepare('INSERT INTO subcategories (category_id, slug, name, position) VALUES (?, ?, ?, ?)')
                        ->execute([$catId, $s['slug'], $s['name'], $subPos]);
                }
                $keep[$s['slug']] = true;
            }
            foreach ($existingSubs as $slug => $subId) {
                if (!isset($keep[$slug])) {
                    $pdo->prepare('DELETE FROM subcategories WHERE id = ?')->execute([$subId]);
                }
            }
        }

        // Categorías que se quitaron de la lista
        foreach ($existing as $slug => $row) {
            if (isset($seen[$slug])) {
                continue;
            }
            $st = $pdo->prepare('SELECT COUNT(*) FROM products WHERE category_id = ?');
            $st->execute([$row['id']]);
            if ((int) $st->fetchColumn() > 0) {
                throw new ApiError('No se puede eliminar una categoría que todavía tiene productos. Movelos o eliminalos antes.');
            }
            $pdo->prepare('DELETE FROM categories WHERE id = ?')->execute([$row['id']]);
            $replacedImages[] = $row['image'];
        }
    });

    foreach ($replacedImages as $path) {
        delete_upload_if_unused($path);
    }
    return get_data(true)['categories'];
}

/* =========================================================
   Datos del negocio
   ========================================================= */

function save_settings(array $in): array
{
    $whatsapp = preg_replace('/\D/', '', (string) ($in['whatsapp'] ?? ''));
    if (!preg_match('/^\d{10,15}$/', $whatsapp)) {
        throw new ApiError('El número de WhatsApp tiene que tener entre 10 y 15 números. Ej: 5492326422390');
    }
    $brands = [];
    foreach (array_slice((array) ($in['brands'] ?? []), 0, 40) as $b) {
        $b = clean_text($b, 60, 'Marca');
        if ($b !== '') {
            $brands[] = $b;
        }
    }
    $hours = implode("\n", array_filter(array_map('trim', explode("\n", clean_text($in['hours'] ?? '', 500, 'Horarios')))));

    $clean = [
        'whatsapp'        => $whatsapp,
        'whatsappDisplay' => clean_text($in['whatsappDisplay'] ?? '', 40, 'Número como se muestra'),
        'address'         => clean_text($in['address'] ?? '', 120, 'Dirección'),
        'city'            => clean_text($in['city'] ?? '', 120, 'Ciudad'),
        'hours'           => $hours,
        'hoursShort'      => clean_text($in['hoursShort'] ?? '', 120, 'Horario resumido'),
        'instagram'       => valid_url($in['instagram'] ?? '', 'Instagram'),
        'facebook'        => valid_url($in['facebook'] ?? '', 'Facebook'),
        'mapEmbed'        => valid_map_embed($in['mapEmbed'] ?? ''),
        'heroEyebrow'     => clean_text($in['heroEyebrow'] ?? '', 120, 'Texto chico de arriba'),
        'heroTitle'       => clean_text($in['heroTitle'] ?? '', 120, 'Título'),
        'heroHighlight'   => clean_text($in['heroHighlight'] ?? '', 60, 'Final del título'),
        'heroText'        => clean_text($in['heroText'] ?? '', 400, 'Texto de presentación'),
        'heroImage'       => valid_asset_path($in['heroImage'] ?? ''),
        'brands'          => $brands,
    ];

    $previousHero = get_data(true)['settings']['heroImage'] ?? '';
    write_settings($clean);
    if ($previousHero !== $clean['heroImage']) {
        delete_upload_if_unused((string) $previousHero);
    }
    return $clean;
}

function write_settings(array $settings): void
{
    $st = db()->prepare('INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)');
    foreach ($settings as $key => $value) {
        if (in_array($key, SETTINGS_KEYS, true)) {
            $st->execute([$key, json_encode($value, JSON_UNESCAPED_UNICODE)]);
        }
    }
}

/* =========================================================
   Fotos subidas
   ========================================================= */

function store_upload(array $file, string $folder): string
{
    if (!in_array($folder, ['products', 'categories', 'site'], true)) {
        $folder = 'products';
    }
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
        $tooBig = in_array($file['error'] ?? 0, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true);
        throw new ApiError($tooBig ? 'La foto es demasiado pesada.' : 'No llegó la foto. Probá de nuevo.');
    }
    $maxBytes = (int) (config()['max_upload_mb'] ?? 8) * 1024 * 1024;
    if ($file['size'] > $maxBytes) {
        throw new ApiError('La foto es demasiado pesada (máximo ' . (config()['max_upload_mb'] ?? 8) . ' MB).');
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $extByMime = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $info = @getimagesize($file['tmp_name']);
    if (!isset($extByMime[$mime]) || !$info || $info[0] < 1 || $info[0] > 8000 || $info[1] > 8000) {
        throw new ApiError('Ese archivo no es una foto válida. Usá JPG, PNG o WEBP.');
    }

    $dir = UPLOADS_DIR . '/' . $folder . '/' . date('Y/m');
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        throw new ApiError('No se pudo guardar la foto en el servidor (permisos de la carpeta uploads).', 500);
    }
    $name = bin2hex(random_bytes(12));

    // Si el servidor tiene GD, la foto se vuelve a generar (descarta datos ocultos y la achica)
    if (function_exists('imagecreatefromstring') && function_exists('imagejpeg')) {
        $src = @imagecreatefromstring((string) file_get_contents($file['tmp_name']));
        if ($src) {
            [$w, $h] = [imagesx($src), imagesy($src)];
            $scale = min(1, 1600 / max($w, $h));
            $nw = max(1, (int) round($w * $scale));
            $nh = max(1, (int) round($h * $scale));
            $dst = imagecreatetruecolor($nw, $nh);
            imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255));
            imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
            $target = "{$dir}/{$name}.jpg";
            imagejpeg($dst, $target, 82);
            imagedestroy($src);
            imagedestroy($dst);
            return relative_upload_path($target);
        }
    }

    $target = "{$dir}/{$name}." . $extByMime[$mime];
    if (!move_uploaded_file($file['tmp_name'], $target)) {
        throw new ApiError('No se pudo guardar la foto en el servidor.', 500);
    }
    return relative_upload_path($target);
}

function relative_upload_path(string $absolute): string
{
    return 'uploads/' . ltrim(str_replace('\\', '/', substr($absolute, strlen(UPLOADS_DIR))), '/');
}

function delete_upload_if_unused(string $path): void
{
    if ($path === '' || strpos($path, 'uploads/') !== 0 || strpos($path, '..') !== false) {
        return; // las fotos de ejemplo (assets/) nunca se borran
    }
    $pdo = db();
    $st = $pdo->prepare('SELECT (SELECT COUNT(*) FROM product_images WHERE path = ?) + (SELECT COUNT(*) FROM categories WHERE image = ?)');
    $st->execute([$path, $path]);
    if ((int) $st->fetchColumn() > 0) {
        return;
    }
    $st = $pdo->prepare("SELECT COUNT(*) FROM settings WHERE name = 'heroImage' AND value = ?");
    $st->execute([json_encode($path, JSON_UNESCAPED_UNICODE)]);
    if ((int) $st->fetchColumn() > 0) {
        return;
    }
    $file = ROOT_DIR . '/' . $path;
    if (is_file($file)) {
        @unlink($file);
    }
}

/* =========================================================
   Reemplazo completo (instalación y "Recuperar una copia")
   ========================================================= */

function replace_all(array $data, bool $withProducts = true): void
{
    in_transaction(function () use ($data, $withProducts) {
        $pdo = db();
        $pdo->exec('DELETE FROM product_images');
        $pdo->exec('DELETE FROM products');
        $pdo->exec('DELETE FROM subcategories');
        $pdo->exec('DELETE FROM categories');

        write_settings((array) ($data['settings'] ?? []));
        save_categories((array) ($data['categories'] ?? []));

        if ($withProducts) {
            foreach ((array) ($data['products'] ?? []) as $p) {
                save_product(['id' => ''] + (array) $p, (string) ($p['id'] ?? ''), false);
            }
        }
    });
}
