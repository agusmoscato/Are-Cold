<?php
/* Ingreso al panel.
   GET                         → ¿hay sesión? { loggedIn, username, csrf }
   POST {action:"login", username, password}
   POST {action:"logout"}
   POST {action:"changePassword", current, next}   (requiere sesión + X-CSRF-Token) */

declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
install_json_error_handler();

const MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_MINUTES = 15;
// Contraseña del usuario de prueba de sql/arecold-base-inicial.sql: si se sigue usando, el panel pide cambiarla
const SQL_DEFAULT_PASSWORD = 'arecold-cambiar-2026';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // El panel no usa datos de ejemplo: si la base no está lista, lo dice claramente
    $problem = db_problem();
    if ($problem) {
        json_out(['ok' => false, 'dbError' => true, 'error' => $problem], 503);
    }
    $admin = current_admin();
    json_out([
        'ok'       => true,
        'loggedIn' => (bool) $admin,
        'username' => $admin['username'] ?? null,
        'csrf'     => $admin ? csrf_token() : null,
        'defaultPassword' => !empty($_SESSION['default_password']),
    ]);
}

require_method('POST');
$body = read_json_body();
$action = (string) ($body['action'] ?? '');

if ($action === 'login') {
    $pdo = db();
    $ip = client_ip();

    $pdo->prepare('DELETE FROM login_attempts WHERE attempted_at < (NOW() - INTERVAL 1 DAY)')->execute();
    $st = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND attempted_at > (NOW() - INTERVAL ' . LOCKOUT_MINUTES . ' MINUTE)');
    $st->execute([$ip]);
    if ((int) $st->fetchColumn() >= MAX_FAILED_ATTEMPTS) {
        throw new ApiError('Hubo demasiados intentos fallidos. Esperá ' . LOCKOUT_MINUTES . ' minutos y probá de nuevo.', 429);
    }

    $username = trim((string) ($body['username'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    $st = $pdo->prepare('SELECT id, username, password_hash FROM admins WHERE username = ?');
    $st->execute([$username]);
    $admin = $st->fetch();

    if (!$admin || !password_verify($password, $admin['password_hash'])) {
        $pdo->prepare('INSERT INTO login_attempts (ip) VALUES (?)')->execute([$ip]);
        usleep(400000); // frena las pruebas automáticas
        throw new ApiError('El usuario o la contraseña no coinciden. Revisalos y probá de nuevo.', 401);
    }

    if (password_needs_rehash($admin['password_hash'], PASSWORD_DEFAULT)) {
        $pdo->prepare('UPDATE admins SET password_hash = ? WHERE id = ?')
            ->execute([password_hash($password, PASSWORD_DEFAULT), $admin['id']]);
    }
    $pdo->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute([$ip]);

    start_admin_session();
    session_regenerate_id(true);
    $_SESSION['admin_id'] = (int) $admin['id'];
    $_SESSION['admin_user'] = $admin['username'];
    $_SESSION['last_seen'] = time();
    $_SESSION['default_password'] = hash_equals(SQL_DEFAULT_PASSWORD, $password);
    unset($_SESSION['csrf']);

    json_out(['ok' => true, 'username' => $admin['username'], 'csrf' => csrf_token(), 'defaultPassword' => $_SESSION['default_password']]);
}

if ($action === 'logout') {
    start_admin_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $p['path'], 'secure' => $p['secure'], 'httponly' => true, 'samesite' => 'Lax']);
    }
    session_destroy();
    json_out(['ok' => true]);
}

if ($action === 'changePassword') {
    $admin = require_admin();
    require_csrf();
    $current = (string) ($body['current'] ?? '');
    $next = (string) ($body['next'] ?? '');

    $st = db()->prepare('SELECT password_hash FROM admins WHERE id = ?');
    $st->execute([$admin['id']]);
    if (!password_verify($current, (string) $st->fetchColumn())) {
        throw new ApiError('La contraseña actual no es correcta.');
    }
    if (mb_strlen($next) < 10) {
        throw new ApiError('La contraseña nueva tiene que tener al menos 10 caracteres.');
    }
    if (hash_equals(SQL_DEFAULT_PASSWORD, $next)) {
        throw new ApiError('Elegí una contraseña distinta a la de prueba.');
    }
    db()->prepare('UPDATE admins SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($next, PASSWORD_DEFAULT), $admin['id']]);
    session_regenerate_id(true);
    $_SESSION['default_password'] = false;
    json_out(['ok' => true]);
}

throw new ApiError('Acción desconocida.', 404);
