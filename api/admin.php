<?php
/* Acciones del panel. Todas requieren sesión; las que modifican datos, además, el encabezado X-CSRF-Token.

   GET  ?action=data                       → catálogo completo (incluye productos dados de baja)
   POST {action:"saveProduct", product}
   POST {action:"setProductActive", id, active}
   POST {action:"deleteProduct", id}
   POST {action:"saveCategories", categories}
   POST {action:"saveSettings", settings}
   POST {action:"importBackup", data}
   POST multipart action=upload, folder=products|categories|site|brands, image=<archivo> */

declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/repo.php';
install_json_error_handler();

require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (($_GET['action'] ?? '') === 'data') {
        json_out(['ok' => true, 'data' => get_data(true)]);
    }
    throw new ApiError('Acción desconocida.', 404);
}

require_method('POST');
require_csrf();

// Subida de fotos (multipart/form-data)
if (($_POST['action'] ?? '') === 'upload') {
    if (empty($_FILES['image'])) {
        throw new ApiError('No llegó la foto. Si es muy pesada, probá con una más liviana.');
    }
    json_out(['ok' => true, 'path' => store_upload($_FILES['image'], (string) ($_POST['folder'] ?? 'products'))]);
}

$body = read_json_body();

switch ((string) ($body['action'] ?? '')) {
    case 'saveProduct':
        json_out(['ok' => true, 'product' => save_product((array) ($body['product'] ?? []))]);

    case 'setProductActive':
        set_product_active((string) ($body['id'] ?? ''), !empty($body['active']));
        json_out(['ok' => true]);

    case 'deleteProduct':
        delete_product((string) ($body['id'] ?? ''));
        json_out(['ok' => true]);

    case 'saveCategories':
        json_out(['ok' => true, 'categories' => save_categories((array) ($body['categories'] ?? []))]);

    case 'saveSettings':
        json_out(['ok' => true, 'settings' => save_settings((array) ($body['settings'] ?? []))]);

    case 'importBackup':
        $data = (array) ($body['data'] ?? []);
        if (!isset($data['categories'], $data['products'], $data['settings']) || !is_array($data['categories']) || !is_array($data['products'])) {
            throw new ApiError('Ese archivo no es una copia del panel.');
        }
        replace_all($data, true);
        json_out(['ok' => true, 'data' => get_data(true)]);
}

throw new ApiError('Acción desconocida.', 404);
