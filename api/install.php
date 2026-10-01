<?php
/* Instalación del sitio (se usa una sola vez).
   Crea las tablas, el usuario administrador y carga categorías, datos del negocio
   y (opcional) los productos de ejemplo desde data/datos-de-ejemplo.js.
   Alternativa sin este instalador: importar sql/arecold-base-inicial.sql desde phpMyAdmin.
   Cuando ya existe un administrador, deja de funcionar. */

declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/repo.php';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function page(string $title, string $body): void
{
    $t = htmlspecialchars($title);
    echo <<<HTML
<!DOCTYPE html>
<html lang="es-AR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>{$t} | Are-Cold</title>
<style>
  body{margin:0;font:14px/1.5 system-ui,'Segoe UI',sans-serif;background:#f4f5f7;color:#14181f;display:flex;justify-content:center;padding:2rem 1rem}
  main{width:min(460px,100%);background:#fff;border:1px solid #e2e5e9;border-radius:12px;padding:1.75rem;box-shadow:0 1px 3px rgba(16,24,40,.08)}
  h1{font-size:18px;margin:0 0 .5rem} p{margin:.5rem 0;color:#434b57}
  label{display:grid;gap:.3rem;margin-top:1rem;font-weight:600;font-size:13px;color:#434b57}
  input[type=text],input[type=password]{height:38px;padding:0 .75rem;border:1px solid #cdd2d8;border-radius:8px;font:inherit}
  .check{display:flex;gap:.5rem;align-items:center;font-weight:500}
  button,.btn{margin-top:1.25rem;display:inline-flex;align-items:center;justify-content:center;height:38px;padding:0 1rem;border:0;border-radius:8px;background:#14181f;color:#fff;font:600 14px system-ui;cursor:pointer;text-decoration:none;width:100%}
  .err{background:#fdecec;color:#c62828;border-radius:8px;padding:.6rem .8rem}
  .ok{background:#e8f5ec;color:#15803d;border-radius:8px;padding:.6rem .8rem}
  .warn{background:#fff6e0;border:1px solid #f1d48a;color:#6b4e00;border-radius:8px;padding:.6rem .8rem}
  code{background:#f4f5f7;padding:.1rem .3rem;border-radius:4px}
  small{color:#6b7380}
</style></head><body><main>{$body}</main></body></html>
HTML;
    exit;
}

$h = fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES);

/* 1. Configuración y conexión */
try {
    $config = config();
    $pdo = db();
} catch (ApiError $e) {
    page('Falta configurar', '<h1>Falta configurar el servidor</h1><p class="err">' . $h($e->getMessage()) . '</p>
      <p>Pasos: copiá <code>api/config.sample.php</code> como <code>api/config.php</code> y completá los datos de la base de Hostinger (hPanel → Bases de datos MySQL). Después recargá esta página.</p>');
}

/* 2. Tablas (se puede repetir sin problema) */
$schema = (string) file_get_contents(__DIR__ . '/lib/schema.sql');
$schema = preg_replace('/^--.*$/m', '', $schema);
foreach (array_filter(array_map('trim', explode(';', $schema))) as $statement) {
    $pdo->exec($statement);
}

$setupKey = (string) ($config['setup_key'] ?? '');
if ($setupKey === '' || stripos($setupKey, 'CAMBIAR') !== false || strlen($setupKey) < 12) {
    page('Falta la clave', '<h1>Falta la clave de instalación</h1>
      <p class="err">En <code>api/config.php</code>, cambiá <code>setup_key</code> por una frase propia de al menos 12 caracteres.</p>');
}

/* 3. Ya instalado: solo permite restablecer la contraseña del panel (no toca ningún dato) */
if ((int) $pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn() > 0) {
    $error = '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $username = trim((string) ($_POST['username'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');
        $st = $pdo->prepare('SELECT id FROM admins WHERE username = ?');
        $st->execute([$username]);
        $adminId = $st->fetchColumn();
        if (!hash_equals($setupKey, (string) ($_POST['setup_key'] ?? ''))) {
            $error = 'La clave de instalación no coincide con la de api/config.php.';
        } elseif (!$adminId) {
            $error = 'No existe un usuario con ese nombre.';
        } elseif (mb_strlen($password) < 10) {
            $error = 'La contraseña tiene que tener al menos 10 caracteres.';
        } elseif ($password !== (string) ($_POST['password2'] ?? '')) {
            $error = 'Las dos contraseñas no coinciden.';
        } else {
            $pdo->prepare('UPDATE admins SET password_hash = ? WHERE id = ?')->execute([password_hash($password, PASSWORD_DEFAULT), $adminId]);
            $pdo->prepare('DELETE FROM login_attempts')->execute();
            page('Contraseña restablecida', '<h1>Contraseña restablecida</h1>
              <p class="ok">Ya podés ingresar al panel con la contraseña nueva.</p>
              <p class="warn">Ahora borrá <code>api/install.php</code> del servidor.</p>
              <a class="btn" href="../admin/">Ir al panel</a>');
        }
    }
    page('Ya instalado', '<h1>El sitio ya está instalado</h1>
      <p>Esta página ya no instala nada. Solo sirve para restablecer la contraseña del panel si se perdió; los productos y datos no se tocan.</p>
      <p class="warn">Si no la necesitás, borrá <code>api/install.php</code> del servidor.</p>'
      . ($error ? '<p class="err">' . $h($error) . '</p>' : '') . '
      <form method="post" autocomplete="off">
        <label>Clave de instalación <small>La de <code>setup_key</code> en api/config.php</small>
          <input type="password" name="setup_key" required></label>
        <label>Usuario del panel <input type="text" name="username" required></label>
        <label>Contraseña nueva <small>Al menos 10 caracteres</small>
          <input type="password" name="password" required minlength="10" autocomplete="new-password"></label>
        <label>Repetir contraseña nueva
          <input type="password" name="password2" required minlength="10" autocomplete="new-password"></label>
        <button type="submit">Restablecer contraseña</button>
      </form>');
}

$error = '';
$form = ['username' => 'admin', 'seed' => true];

/* 4. Crear administrador y cargar datos */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $form['username'] = trim((string) ($_POST['username'] ?? ''));
    $form['seed'] = !empty($_POST['seed']);
    $password = (string) ($_POST['password'] ?? '');

    if (!hash_equals($setupKey, (string) ($_POST['setup_key'] ?? ''))) {
        $error = 'La clave de instalación no coincide con la de api/config.php.';
    } elseif (!preg_match('/^[A-Za-z0-9._-]{3,60}$/', $form['username'])) {
        $error = 'El usuario tiene que tener entre 3 y 60 caracteres: letras, números, punto, guion o guion bajo.';
    } elseif (mb_strlen($password) < 10) {
        $error = 'La contraseña tiene que tener al menos 10 caracteres.';
    } elseif ($password !== (string) ($_POST['password2'] ?? '')) {
        $error = 'Las dos contraseñas no coinciden.';
    } else {
        try {
            $seed = load_demo_data();
        } catch (ApiError $e) {
            $seed = null;
            $error = $e->getMessage();
        }
        if ($seed) {
            replace_all($seed, $form['seed']);
            $pdo->prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)')
                ->execute([$form['username'], password_hash($password, PASSWORD_DEFAULT)]);
            page('Listo', '<h1>Instalación completa</h1>
              <p class="ok">Se creó el usuario <strong>' . $h($form['username']) . '</strong> y se cargaron '
              . count($seed['categories']) . ' categorías' . ($form['seed'] ? ' y ' . count($seed['products']) . ' productos de ejemplo' : '') . '.</p>
              <p class="warn">Por seguridad, ahora borrá <code>api/install.php</code> del servidor (desde el Administrador de archivos de Hostinger).</p>
              <a class="btn" href="../admin/">Ir al panel</a>');
        }
    }
}

page('Instalación', '<h1>Instalación del sitio</h1>
  <p>Se usa una sola vez: crea el usuario del panel y carga las categorías y los datos del negocio.</p>'
  . ($error ? '<p class="err">' . $h($error) . '</p>' : '') . '
  <form method="post" autocomplete="off">
    <label>Clave de instalación <small>La que pusiste en <code>setup_key</code> de api/config.php</small>
      <input type="password" name="setup_key" required></label>
    <label>Usuario del panel
      <input type="text" name="username" value="' . $h($form['username']) . '" required></label>
    <label>Contraseña <small>Al menos 10 caracteres</small>
      <input type="password" name="password" required minlength="10" autocomplete="new-password"></label>
    <label>Repetir contraseña
      <input type="password" name="password2" required minlength="10" autocomplete="new-password"></label>
    <label class="check"><input type="checkbox" name="seed" value="1"' . ($form['seed'] ? ' checked' : '') . '>
      Cargar los productos de ejemplo (se pueden borrar después)</label>
    <button type="submit">Instalar</button>
  </form>');
