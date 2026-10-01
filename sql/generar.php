<?php
/* Genera sql/arecold-base-inicial.sql a partir de:
   - api/lib/schema.sql            (estructura)
   - data/datos-de-ejemplo.js      (datos de ejemplo)
   + un usuario administrador de prueba.

   Uso (desde la carpeta del proyecto):  php sql/generar.php
   Volver a correrlo si cambia el esquema o los datos de ejemplo. Solo funciona por línea de comandos. */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../api/lib/bootstrap.php';
require __DIR__ . '/../api/lib/repo.php';

const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'arecold-cambiar-2026'; // misma que SQL_DEFAULT_PASSWORD en api/auth.php
const BASE_DATE = '2026-01-01 00:00:00';

/* Texto SQL con escape para MySQL/MariaDB (modo por defecto, con barra invertida) */
function q($value): string
{
    if ($value === null) {
        return 'NULL';
    }
    if (is_bool($value)) {
        return $value ? '1' : '0';
    }
    if (is_int($value)) {
        return (string) $value;
    }
    return "'" . strtr((string) $value, ["\\" => "\\\\", "'" => "\\'", "\n" => "\\n", "\r" => "\\r", "\0" => "\\0", "\x1a" => "\\Z"]) . "'";
}

function json_value($value): string
{
    return q(json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

$data = load_demo_data();
$schema = trim((string) file_get_contents(__DIR__ . '/../api/lib/schema.sql'));
$schema = preg_replace('/^--.*\R/m', '', $schema);

$out = [];
$out[] = '-- =====================================================================';
$out[] = '-- Refrigeración Are-Cold — base inicial (estructura + datos de EJEMPLO)';
$out[] = '-- =====================================================================';
$out[] = '-- Generado con: php sql/generar.php  (' . date('Y-m-d') . ')';
$out[] = '-- Compatible con MySQL 5.7+ / MariaDB 10.3+. Se puede importar dos veces sin errores:';
$out[] = '-- las tablas usan CREATE TABLE IF NOT EXISTS y los datos INSERT IGNORE (no pisa lo que ya exista).';
$out[] = '--';
$out[] = '-- IMPORTAR EN HOSTINGER:';
$out[] = '--   1. hPanel → Bases de datos → phpMyAdmin → entrar a la base del sitio.';
$out[] = '--   2. Pestaña "Importar" → elegir este archivo → "Importar" (o "Continuar").';
$out[] = '--   3. Completar api/config.php con los datos de esa base y entrar a /admin/.';
$out[] = '--';
$out[] = '-- USUARIO DEL PANEL DE PRUEBA:';
$out[] = '--   usuario:    ' . ADMIN_USER;
$out[] = '--   contraseña: ' . ADMIN_PASSWORD;
$out[] = '--   Cambiarla apenas se ingresa: Panel → Datos del negocio → Tu cuenta.';
$out[] = '--   (El panel muestra un aviso mientras se siga usando esta contraseña.)';
$out[] = '--';
$out[] = '-- Los productos, textos y la foto del hero son de EJEMPLO, no datos reales del negocio.';
$out[] = '-- =====================================================================';
$out[] = '';
$out[] = 'SET NAMES utf8mb4;';
$out[] = 'SET FOREIGN_KEY_CHECKS = 0;';
$out[] = '';
$out[] = '-- ---------------------------------------------------------------------';
$out[] = '-- Estructura';
$out[] = '-- ---------------------------------------------------------------------';
$out[] = '';
$out[] = $schema;
$out[] = '';
$out[] = '-- ---------------------------------------------------------------------';
$out[] = '-- Usuario administrador de prueba';
$out[] = '-- ---------------------------------------------------------------------';
$out[] = 'INSERT IGNORE INTO admins (username, password_hash) VALUES (' . q(ADMIN_USER) . ', ' . q(password_hash(ADMIN_PASSWORD, PASSWORD_BCRYPT)) . ');';
$out[] = '';
$out[] = '-- ---------------------------------------------------------------------';
$out[] = '-- Datos del negocio';
$out[] = '-- ---------------------------------------------------------------------';
$rows = [];
foreach ($data['settings'] as $key => $value) {
    if (in_array($key, SETTINGS_KEYS, true)) {
        $rows[] = '  (' . q($key) . ', ' . json_value($value) . ')';
    }
}
$out[] = "INSERT IGNORE INTO settings (name, value) VALUES\n" . implode(",\n", $rows) . ';';
$out[] = '';

$out[] = '-- ---------------------------------------------------------------------';
$out[] = '-- Categorías y subcategorías (ids fijos para que los productos las referencien)';
$out[] = '-- ---------------------------------------------------------------------';
$catRows = [];
$subRows = [];
$catId = [];
$subId = [];
$nextSub = 1;
foreach ($data['categories'] as $i => $c) {
    $id = $i + 1;
    $catId[$c['slug']] = $id;
    $catRows[] = '  (' . implode(', ', [$id, q($c['slug']), q($c['name']), q($c['icon']), q($c['image'] ?? ''), q(!empty($c['highlight'])), $i]) . ')';
    foreach ($c['subcategories'] as $j => $s) {
        $subId[$c['slug']][$s['slug']] = $nextSub;
        $subRows[] = '  (' . implode(', ', [$nextSub, $id, q($s['slug']), q($s['name']), $j]) . ')';
        $nextSub++;
    }
}
$out[] = "INSERT IGNORE INTO categories (id, slug, name, icon, image, highlight, position) VALUES\n" . implode(",\n", $catRows) . ';';
$out[] = '';
$out[] = "INSERT IGNORE INTO subcategories (id, category_id, slug, name, position) VALUES\n" . implode(",\n", $subRows) . ';';
$out[] = '';

$out[] = '-- ---------------------------------------------------------------------';
$out[] = '-- Productos de ejemplo y sus fotos';
$out[] = '-- ---------------------------------------------------------------------';
$prodRows = [];
$imgRows = [];
foreach ($data['products'] as $i => $p) {
    $sub = $p['subcategory'] !== '' ? ($subId[$p['category']][$p['subcategory']] ?? null) : null;
    $created = date('Y-m-d H:i:s', strtotime(BASE_DATE) + $i); // conserva el orden del catálogo
    $prodRows[] = '  (' . implode(', ', [
        q($p['id']), $catId[$p['category']], $sub === null ? 'NULL' : $sub, q($p['name']), q($p['tag'] ?? ''),
        q(($p['active'] ?? true) !== false), q($p['description'] ?? ''), json_value($p['features'] ?? []), q($created), q($created),
    ]) . ')';
    foreach ($p['images'] ?? [] as $pos => $path) {
        $imgRows[] = '  (' . implode(', ', [q($p['id']), q($path), $pos]) . ')';
    }
}
$out[] = "INSERT IGNORE INTO products (id, category_id, subcategory_id, name, tag, active, description, features, created_at, updated_at) VALUES\n" . implode(",\n", $prodRows) . ';';
$out[] = '';
$out[] = "INSERT IGNORE INTO product_images (product_id, path, position) VALUES\n" . implode(",\n", $imgRows) . ';';
$out[] = '';
$out[] = 'SET FOREIGN_KEY_CHECKS = 1;';
$out[] = '';

file_put_contents(__DIR__ . '/arecold-base-inicial.sql', implode("\n", $out));
echo 'Listo: sql/arecold-base-inicial.sql (' . count($data['categories']) . ' categorías, ' . count($subRows) . ' subcategorías, ' . count($prodRows) . " productos)\n";
