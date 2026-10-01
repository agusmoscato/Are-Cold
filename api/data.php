<?php
/* Datos públicos del sitio (solo productos visibles).

   api/data.php            → JSON
   api/data.php?format=js  → script que define window.AECOLD_SERVER. Las páginas lo cargan con
                             <script src="api/data.php?format=js"> antes del resto, así el sitio
                             arranca con los datos ya disponibles, sin esperar un fetch.

   FALLBACK SIN BASE: si no hay api/config.php, no conecta o faltan las tablas, en vez de
   devolver un catálogo vacío se sirven los DATOS DE EJEMPLO (data/datos-de-ejemplo.js) con
   "demo": true. El sitio muestra entonces un aviso arriba. NO son datos reales del negocio.
   El panel nunca usa este fallback (api/admin.php falla con un mensaje claro). */

declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/repo.php';

$asScript = ($_GET['format'] ?? '') === 'js';
$reason = null;

try {
    $data = get_data(false);
} catch (Throwable $e) {
    error_log('Are-Cold data.php (se usan datos de ejemplo): ' . $e->getMessage());
    $reason = $e instanceof ApiError ? $e->getMessage() : 'La base de datos no tiene las tablas del sitio.';
    try {
        $data = load_demo_data();
        $data['products'] = array_values(array_filter($data['products'], fn ($p) => ($p['active'] ?? true) !== false));
        $data['demo'] = true;
    } catch (Throwable $e2) {
        $data = ['settings' => (object) [], 'categories' => [], 'products' => [], 'demo' => true];
    }
}

header('X-Content-Type-Options: nosniff');
// Cache corto: un cambio del panel se ve como mucho un minuto después (el fallback no se cachea)
header($reason ? 'Cache-Control: no-store' : 'Cache-Control: public, max-age=60');

$json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG);

if ($asScript) {
    header('Content-Type: application/javascript; charset=utf-8');
    echo "window.AECOLD_SERVER = {$json};\n";
    if ($reason) {
        echo 'console.warn(' . json_encode('Are-Cold: se muestran DATOS DE EJEMPLO porque no hay base conectada. Motivo: ' . $reason, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ");\n";
    }
    exit;
}

header('Content-Type: application/json; charset=utf-8');
echo $json;
