-- Esquema de la base de Refrigeración Are-Cold (MySQL 5.7+ / MariaDB 10.3+).
-- Lo ejecuta install.php; se puede correr de nuevo sin romper nada (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(60)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Intentos fallidos de ingreso, para frenar a quien prueba contraseñas
CREATE TABLE IF NOT EXISTS login_attempts (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ip           VARCHAR(45) NOT NULL,
  attempted_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip_time (ip, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos del negocio: un valor por clave, guardado como JSON
CREATE TABLE IF NOT EXISTS settings (
  name  VARCHAR(60) PRIMARY KEY,
  value TEXT        NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug      VARCHAR(80)  NOT NULL UNIQUE,
  name      VARCHAR(120) NOT NULL,
  icon      VARCHAR(40)  NOT NULL DEFAULT 'box',
  image     VARCHAR(255) NOT NULL DEFAULT '',
  highlight TINYINT(1)   NOT NULL DEFAULT 0,
  position  INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subcategories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  slug        VARCHAR(80)  NOT NULL,
  name        VARCHAR(120) NOT NULL,
  position    INT          NOT NULL DEFAULT 0,
  UNIQUE KEY uq_cat_slug (category_id, slug),
  CONSTRAINT fk_sub_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id             VARCHAR(40)  PRIMARY KEY,
  category_id    INT UNSIGNED NOT NULL,
  subcategory_id INT UNSIGNED NULL,
  name           VARCHAR(160) NOT NULL,
  tag            VARCHAR(20)  NOT NULL DEFAULT '',
  active         TINYINT(1)   NOT NULL DEFAULT 1,
  description    TEXT         NOT NULL,
  features       TEXT         NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cat (category_id),
  CONSTRAINT fk_prod_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_prod_sub FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id VARCHAR(40)  NOT NULL,
  path       VARCHAR(255) NOT NULL,
  position   INT          NOT NULL DEFAULT 0,
  UNIQUE KEY uq_prod_pos (product_id, position),
  CONSTRAINT fk_img_prod FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
