<?php
/* Configuración del servidor de Refrigeración Are-Cold.

   1. Copiá este archivo como config.php (en esta misma carpeta /api).
   2. Completá los datos de la base que creaste en Hostinger
      (hPanel → Bases de datos → Bases de datos MySQL).
   3. Inventá una "clave de instalación" larga: la pide install.php una sola vez.

   config.php NO se sube a Git (tiene contraseñas). */

return [
    'db' => [
        'host'     => 'localhost',      // en Hostinger casi siempre es "localhost"
        'port'     => 3306,
        'name'     => 'u000000000_arecold',
        'user'     => 'u000000000_arecold',
        'password' => 'CAMBIAR',
    ],

    // Se pide al correr install.php, para que nadie más pueda instalar antes que vos
    'setup_key' => 'CAMBIAR-por-una-frase-larga',

    // Cuánto dura la sesión del panel sin uso (en minutos)
    'session_idle_minutes' => 480,

    // Tamaño máximo de cada foto subida (en MB)
    'max_upload_mb' => 8,
];
