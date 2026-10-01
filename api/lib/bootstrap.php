<?php
/* Núcleo compartido de la API: configuración, base de datos, sesión del panel y respuestas JSON.
   Compatible con PHP 8.0+. */

declare(strict_types=1);

define('ROOT_DIR', dirname(__DIR__, 2));        // carpeta raíz del sitio
define('UPLOADS_DIR', ROOT_DIR . '/uploads');

/* Error con un mensaje pensado para mostrarle a quien usa el panel */
class ApiError extends Exception
{
    public int $status;

    public function __construct(string $message, int $status = 400)
    {
        parent::__construct($message);
        $this->status = $status;
    }
}

function config(): array
{
    static $config = null;
    if ($config === null) {
        $file = dirname(__DIR__) . '/config.php';
        if (!is_file($file)) {
            throw new ApiError('Falta configurar el servidor: copiá api/config.sample.php como api/config.php y completalo.', 503);
        }
        $config = require $file;
    }
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = config()['db'];
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['host'], $c['port'] ?? 3306, $c['name']);
        try {
            $pdo = new PDO($dsn, $c['user'], $c['password'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            error_log('Are-Cold DB: ' . $e->getMessage());
            throw new ApiError('No se pudo conectar con la base de datos. Revisá los datos de api/config.php.', 503);
        }
    }
    return $pdo;
}

/* null si la base está lista; si no, un mensaje que explica qué falta (lo muestra el panel) */
function db_problem(): ?string
{
    try {
        db()->query('SELECT 1 FROM admins LIMIT 1');
        return null;
    } catch (ApiError $e) {
        return $e->getMessage();
    } catch (PDOException $e) {
        return 'La base de datos está conectada pero no tiene las tablas del sitio. Corré api/install.php o importá sql/arecold-base-inicial.sql desde phpMyAdmin.';
    }
}

/* ---------- Respuestas ---------- */

function json_out($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* Cualquier error que no sea ApiError se registra y se responde genérico (no se filtran detalles) */
function install_json_error_handler(): void
{
    set_exception_handler(function (Throwable $e) {
        if ($e instanceof ApiError) {
            json_out(['ok' => false, 'error' => $e->getMessage()], $e->status);
        }
        error_log('Are-Cold API: ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
        json_out(['ok' => false, 'error' => 'Ocurrió un error en el servidor. Probá de nuevo en unos minutos.'], 500);
    });
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new ApiError('La solicitud llegó vacía o con un formato inválido.');
    }
    return $data;
}

function require_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        throw new ApiError('Método no permitido.', 405);
    }
}

function client_ip(): string
{
    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 45);
}

/* ---------- Sesión del panel ---------- */

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
        || ((int) ($_SERVER['SERVER_PORT'] ?? 0) === 443);
}

function start_admin_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('arecold_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => is_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    ini_set('session.use_strict_mode', '1');
    session_start();

    // Cierre por inactividad
    $idle = (int) (config()['session_idle_minutes'] ?? 480) * 60;
    if (!empty($_SESSION['admin_id']) && time() - (int) ($_SESSION['last_seen'] ?? 0) > $idle) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    if (!empty($_SESSION['admin_id'])) {
        $_SESSION['last_seen'] = time();
    }
}

function current_admin(): ?array
{
    start_admin_session();
    if (empty($_SESSION['admin_id'])) {
        return null;
    }
    return ['id' => (int) $_SESSION['admin_id'], 'username' => (string) $_SESSION['admin_user']];
}

function require_admin(): array
{
    $admin = current_admin();
    if (!$admin) {
        throw new ApiError('Tu sesión se cerró. Volvé a ingresar.', 401);
    }
    return $admin;
}

function csrf_token(): string
{
    start_admin_session();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

/* Toda acción que modifica datos debe mandar el token en el encabezado X-CSRF-Token */
function require_csrf(): void
{
    $sent = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if ($sent === '' || !hash_equals(csrf_token(), $sent)) {
        throw new ApiError('La sesión venció. Recargá la página e intentá de nuevo.', 403);
    }
}
