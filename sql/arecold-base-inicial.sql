-- =====================================================================
-- Refrigeración Are-Cold — base inicial (estructura + datos de EJEMPLO)
-- =====================================================================
-- Generado con: php sql/generar.php  (2026-10-01)
-- Compatible con MySQL 5.7+ / MariaDB 10.3+. Se puede importar dos veces sin errores:
-- las tablas usan CREATE TABLE IF NOT EXISTS y los datos INSERT IGNORE (no pisa lo que ya exista).
--
-- IMPORTAR EN HOSTINGER:
--   1. hPanel → Bases de datos → phpMyAdmin → entrar a la base del sitio.
--   2. Pestaña "Importar" → elegir este archivo → "Importar" (o "Continuar").
--   3. Completar api/config.php con los datos de esa base y entrar a /admin/.
--
-- USUARIO DEL PANEL DE PRUEBA:
--   usuario:    admin
--   contraseña: arecold-cambiar-2026
--   Cambiarla apenas se ingresa: Panel → Datos del negocio → Tu cuenta.
--   (El panel muestra un aviso mientras se siga usando esta contraseña.)
--
-- Los productos, textos y la foto del hero son de EJEMPLO, no datos reales del negocio.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- Estructura
-- ---------------------------------------------------------------------


CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(60)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ip           VARCHAR(45) NOT NULL,
  attempted_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip_time (ip, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  price          VARCHAR(12)  NOT NULL DEFAULT '',
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

-- ---------------------------------------------------------------------
-- Usuario administrador de prueba
-- ---------------------------------------------------------------------
INSERT IGNORE INTO admins (username, password_hash) VALUES ('admin', '$2y$10$ge06Y7MAceVahqz81/GhGe4TD.9Cpxqk3u3oiOZ8Jn3abf1voSxI.');

-- ---------------------------------------------------------------------
-- Datos del negocio
-- ---------------------------------------------------------------------
INSERT IGNORE INTO settings (name, value) VALUES
  ('whatsapp', '"5492326422390"'),
  ('whatsappDisplay', '"2326-422390"'),
  ('address', '"Italia 727"'),
  ('city', '"San Antonio de Areco"'),
  ('hours', '"Lunes a viernes de 8 a 12 hs y de 15 a 18 hs.\\nSábados y domingos, cerrado."'),
  ('hoursShort', '"Lunes a viernes, 8 a 12 y 15 a 18 hs"'),
  ('instagram', '"https://www.instagram.com/refigeracion.arecold"'),
  ('facebook', '"https://www.facebook.com/RefrigeracionArecold"'),
  ('mapEmbed', '"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1648.830354113327!2d-59.47645789714209!3d-34.25720034921181!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bbeab398c81597%3A0xa8647181784462e0!2sItalia%20727%2C%20B2760%20San%20Antonio%20de%20Areco%2C%20Provincia%20de%20Buenos%20Aires!5e0!3m2!1ses!2sar!4v1790821329283!5m2!1ses!2sar"'),
  ('heroEyebrow', '"Electrodomésticos, climatización y repuestos"'),
  ('heroTitle', '"El clima de tu casa, resuelto"'),
  ('heroHighlight', '"todo el año"'),
  ('heroText', '"Calefacción para el invierno, aires para el verano y todo lo demás para el hogar. Armá tu selección en el catálogo y te pasamos la cotización por WhatsApp."'),
  ('heroImage', '"assets/fachada-local.jpg"'),
  ('brands', '[]');

-- ---------------------------------------------------------------------
-- Categorías y subcategorías (ids fijos para que los productos las referencien)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO categories (id, slug, name, icon, image, highlight, position) VALUES
  (1, 'calefaccion', 'Calefacción', 'heater', 'assets/productos/calefaccion.jpg', 1, 0),
  (2, 'aires-acondicionados', 'Aires acondicionados', 'ac', 'assets/productos/aires-acondicionados.jpg', 1, 1),
  (3, 'heladeras', 'Heladeras', 'fridge', 'assets/productos/heladeras.jpg', 0, 2),
  (4, 'freezer', 'Freezer', 'freezer', 'assets/productos/freezer.jpg', 0, 3),
  (5, 'lavarropas', 'Lavarropas', 'washer', 'assets/productos/lavarropas.jpg', 0, 4),
  (6, 'secadoras', 'Secadoras', 'dryer', 'assets/productos/secadoras.jpg', 0, 5),
  (7, 'lavavajillas', 'Lavavajillas', 'dishwasher', 'assets/productos/lavavajillas.jpg', 0, 6),
  (8, 'coccion', 'Cocción', 'stove', 'assets/productos/coccion.jpg', 0, 7),
  (9, 'campanas', 'Campanas', 'hood', 'assets/productos/campanas.jpg', 0, 8),
  (10, 'termotanques', 'Termotanques', 'waterheater', 'assets/productos/termotanques.jpg', 0, 9),
  (11, 'smart-tv', 'Smart TV', 'tv', 'assets/productos/smart-tv.jpg', 0, 10),
  (12, 'colchones', 'Colchones', 'mattress', 'assets/productos/colchones.jpg', 0, 11),
  (13, 'pequenos-electrodomesticos', 'Pequeños electrodomésticos', 'blender', 'assets/productos/pequenos-electrodomesticos.jpg', 0, 12),
  (14, 'repuestos', 'Repuestos', 'gear', 'assets/productos/repuestos.jpg', 0, 13);

INSERT IGNORE INTO subcategories (id, category_id, slug, name, position) VALUES
  (1, 1, 'estufas-gas', 'Estufas a gas', 0),
  (2, 1, 'estufas-electricas', 'Estufas eléctricas', 1),
  (3, 1, 'tiro-balanceado', 'Calefactores tiro balanceado', 2),
  (4, 1, 'pantallas-infrarrojas', 'Pantallas infrarrojas', 3),
  (5, 2, 'split-frio-calor', 'Split frío/calor', 0),
  (6, 2, 'split-frio', 'Split solo frío', 1),
  (7, 2, 'portatiles', 'Portátiles', 2),
  (8, 2, 'ventana', 'Ventana', 3),
  (9, 3, 'con-freezer', 'Con freezer', 0),
  (10, 3, 'no-frost', 'No frost', 1),
  (11, 3, 'exhibidoras', 'Exhibidoras / comerciales', 2),
  (12, 4, 'horizontal', 'Horizontal', 0),
  (13, 4, 'vertical', 'Vertical', 1),
  (14, 5, 'carga-frontal', 'Carga frontal', 0),
  (15, 5, 'carga-superior', 'Carga superior', 1),
  (16, 8, 'cocinas', 'Cocinas', 0),
  (17, 8, 'anafes', 'Anafes', 1),
  (18, 10, 'a-gas', 'A gas', 0),
  (19, 10, 'electricos', 'Eléctricos', 1),
  (20, 14, 'repuestos-heladera', 'Repuestos de heladera', 0),
  (21, 14, 'repuestos-aire', 'Repuestos de aire acondicionado', 1),
  (22, 14, 'repuestos-lavarropas', 'Repuestos de lavarropas', 2);

-- ---------------------------------------------------------------------
-- Productos de ejemplo y sus fotos
-- ---------------------------------------------------------------------
INSERT IGNORE INTO products (id, category_id, subcategory_id, name, tag, active, description, features, created_at, updated_at) VALUES
  ('p01', 3, 9, 'Heladera con freezer superior', 'destacado', 1, 'Heladera con freezer de dos puertas, pensada para el consumo diario de una familia. Fría de manera pareja y no ocupa un espacio excesivo en la cocina.', '["Capacidad aproximada: 320 litros","Freezer superior independiente","Estantes de vidrio templado","Bajo consumo eléctrico","Terminación blanca"]', '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
  ('p02', 3, NULL, 'Heladera cíclica una puerta', '', 1, 'Heladera compacta de una puerta, ideal para departamentos, oficinas o como segunda heladera.', '["Capacidad aproximada: 190 litros","Deshielo cíclico automático","Balconera reforzada","Terminación blanca o inox"]', '2026-01-01 00:00:01', '2026-01-01 00:00:01'),
  ('p03', 4, 12, 'Freezer horizontal', 'oferta', 1, 'Freezer horizontal de buena capacidad, pensado para guardar mercadería en cantidad sin ocupar mucho lugar en altura.', '["Capacidad aproximada: 300 litros","Tapa con cierre hermético","Cesto organizador incluido","Sistema de control de temperatura"]', '2026-01-01 00:00:02', '2026-01-01 00:00:02'),
  ('p04', 4, 13, 'Freezer vertical', '', 1, 'Freezer vertical con cajones, para ordenar la mercadería por tipo y encontrar todo rápido.', '["Capacidad aproximada: 220 litros","Cajones deslizables","Puerta reversible","Terminación blanca"]', '2026-01-01 00:00:03', '2026-01-01 00:00:03'),
  ('p05', 5, 14, 'Lavarropas carga frontal', 'destacado', 1, 'Lavarropas automático de carga frontal, con varios programas de lavado para distintos tipos de tela.', '["Capacidad aproximada: 8 kg","Múltiples programas de lavado","Centrifugado de alta velocidad","Visor de puerta","Bajo nivel de ruido"]', '2026-01-01 00:00:04', '2026-01-01 00:00:04'),
  ('p06', 5, 15, 'Lavarropas carga superior', '', 1, 'Lavarropas de carga superior, práctico para el uso diario y de fácil manejo.', '["Capacidad aproximada: 7 kg","Programas rápidos","Tina de acero inoxidable","Control mecánico"]', '2026-01-01 00:00:05', '2026-01-01 00:00:05'),
  ('p07', 6, NULL, 'Secarropas a condensación', '', 1, 'Secarropas que no necesita salida al exterior, ideal para completar el lavado en días de lluvia o poco sol.', '["Capacidad aproximada: 6 kg","Sistema por condensación","Programas por tipo de tela","Filtro de pelusa extraíble"]', '2026-01-01 00:00:06', '2026-01-01 00:00:06'),
  ('p08', 7, NULL, 'Lavavajillas empotrable', '', 1, 'Lavavajillas para instalar bajo mesada, con varios programas según el nivel de suciedad de la vajilla.', '["Capacidad para 12 cubiertos","Programas eco y intensivo","Cestos ajustables","Bajo consumo de agua"]', '2026-01-01 00:00:07', '2026-01-01 00:00:07'),
  ('p09', 8, 16, 'Cocina a gas de 4 hornallas', '', 1, 'Cocina a gas con horno y grill, pensada para el uso diario de una cocina familiar.', '["4 hornallas con encendido eléctrico","Horno con grill","Tapa de vidrio templado","Patas niveladoras"]', '2026-01-01 00:00:08', '2026-01-01 00:00:08'),
  ('p10', 8, 17, 'Anafe eléctrico dos hornallas', '', 1, 'Anafe eléctrico compacto, práctico como cocina principal en espacios chicos o de apoyo en la cocina principal.', '["2 hornallas eléctricas","Perillas de control de temperatura","Superficie de fácil limpieza","Terminación en acero"]', '2026-01-01 00:00:09', '2026-01-01 00:00:09'),
  ('p11', 9, NULL, 'Campana de cocina', '', 1, 'Campana extractora para instalar sobre la cocina, ayuda a mantener el aire y las paredes libres de grasa y humo.', '["Extracción o recirculación","Filtro de aluminio lavable","Iluminación incorporada","Varias velocidades de extracción"]', '2026-01-01 00:00:10', '2026-01-01 00:00:10'),
  ('p12', 2, 5, 'Aire acondicionado split frío/calor', 'oferta', 1, 'Equipo split frío/calor para climatizar un ambiente durante todo el año, con control remoto incluido.', '["3000 frigorías aproximadas","Frío y calor","Control remoto incluido","Filtro purificador de aire","Bajo nivel de ruido"]', '2026-01-01 00:00:11', '2026-01-01 00:00:11'),
  ('p13', 1, 3, 'Calefactor tiro balanceado', '', 1, 'Calefactor a gas de tiro balanceado, toma el aire de afuera y expulsa los gases al exterior sin consumir el oxígeno del ambiente.', '["Instalación con salida a pared","Encendido piezoeléctrico","Termostato regulable","Apto para ambientes medianos"]', '2026-01-01 00:00:12', '2026-01-01 00:00:12'),
  ('p14', 10, 18, 'Termotanque a gas', '', 1, 'Termotanque a gas para agua caliente en toda la casa, con pantalla piloto y buena recuperación.', '["Capacidad aproximada: 80 litros","Encendido piezoeléctrico","Válvula de seguridad","Apto gas natural o envasado"]', '2026-01-01 00:00:13', '2026-01-01 00:00:13'),
  ('p15', 11, NULL, 'Smart TV 50 pulgadas', 'destacado', 1, 'Smart TV con aplicaciones integradas para mirar tus plataformas favoritas sin necesidad de otro dispositivo.', '["Pantalla de 50 pulgadas","Resolución 4K","Wi-Fi integrado","Control remoto con acceso directo a apps","Varias entradas HDMI y USB"]', '2026-01-01 00:00:14', '2026-01-01 00:00:14'),
  ('p16', 12, NULL, 'Colchón de resortes pocket', '', 1, 'Colchón de resortes independientes, se adapta al cuerpo y reduce el movimiento entre las dos plazas.', '["Medida: 2 plazas (140x190 cm)","Resortes pocket independientes","Tela acolchada antialérgica","Doble faz verano/invierno"]', '2026-01-01 00:00:15', '2026-01-01 00:00:15'),
  ('p17', 13, NULL, 'Microondas con grill', '', 1, 'Microondas con función grill, práctico para calentar, descongelar y dorar en pocos minutos.', '["Capacidad aproximada: 25 litros","Función grill","Programas automáticos","Plato giratorio de vidrio"]', '2026-01-01 00:00:16', '2026-01-01 00:00:16'),
  ('p18', 14, 20, 'Burlete para heladera', '', 1, 'Burlete de repuesto para puerta de heladera, ayuda a mantener el frío y bajar el consumo eléctrico. Consultanos el modelo de tu equipo.', '["Varias medidas disponibles","Consultar según marca y modelo","Instalación sencilla","Mejora el sellado de la puerta"]', '2026-01-01 00:00:17', '2026-01-01 00:00:17'),
  ('p19', 14, 22, 'Motor de lavarropas', '', 1, 'Motor de repuesto para lavarropas automático. Traé el dato de tu equipo o el motor usado y te asesoramos sobre el reemplazo.', '["Consultar compatibilidad por marca y modelo","Repuesto para carga frontal y superior","Asesoramiento para el recambio","Instalación no incluida"]', '2026-01-01 00:00:18', '2026-01-01 00:00:18'),
  ('p20', 2, 6, 'Aire acondicionado split solo frío', 'nuevo', 1, 'Split solo frío para dormitorios o ambientes chicos. Enfría rápido y mantiene la temperatura estable sin hacer ruido.', '["2250 frigorías aproximadas","Modo sueño y temporizador","Control remoto incluido","Filtro lavable"]', '2026-01-01 00:00:19', '2026-01-01 00:00:19'),
  ('p21', 2, 7, 'Aire acondicionado portátil', '', 1, 'Equipo portátil con ruedas, para climatizar sin obra ni instalación: solo se apoya la manguera de salida en una ventana.', '["Sin instalación fija","Kit de ventana incluido","Función deshumidificador","Ruedas para moverlo de ambiente"]', '2026-01-01 00:00:20', '2026-01-01 00:00:20'),
  ('p22', 2, 8, 'Aire acondicionado de ventana', '', 1, 'Equipo compacto que se instala en una ventana o en un hueco de pared. Una sola unidad, sin unidad exterior separada.', '["Todo en una sola unidad","Frío y ventilación","Control mecánico o remoto según modelo","Instalación sencilla"]', '2026-01-01 00:00:21', '2026-01-01 00:00:21'),
  ('p23', 1, 1, 'Estufa a gas con salida al exterior', 'oferta', 1, 'Estufa a gas con conducto de salida, para calefaccionar ambientes medianos de forma segura y económica.', '["Salida de gases al exterior","Válvula de seguridad","Encendido piezoeléctrico","Apto gas natural o envasado"]', '2026-01-01 00:00:22', '2026-01-01 00:00:22'),
  ('p24', 1, 2, 'Estufa eléctrica de cuarzo', '', 1, 'Estufa eléctrica liviana, calienta al instante. Ideal para baños, dormitorios o como apoyo en días puntuales.', '["Dos niveles de potencia","Apagado de seguridad por vuelco","Liviana y fácil de mover","No necesita instalación"]', '2026-01-01 00:00:23', '2026-01-01 00:00:23'),
  ('p25', 1, 4, 'Panel calefactor infrarrojo', 'destacado', 1, 'Panel de pared que calefacciona por radiación infrarroja: no reseca el ambiente ni mueve polvo. Se instala como un cuadro.', '["Montaje en pared","Bajo consumo","Superficie de baja temperatura","Silencioso"]', '2026-01-01 00:00:24', '2026-01-01 00:00:24'),
  ('p26', 3, 10, 'Heladera no frost', '', 1, 'Heladera no frost con freezer, sin escarcha ni descongelamiento manual. Mantiene el frío parejo en todos los estantes.', '["Capacidad aproximada: 360 litros","Sistema no frost","Control de temperatura digital","Terminación inox"]', '2026-01-01 00:00:25', '2026-01-01 00:00:25'),
  ('p27', 14, 21, 'Capacitor para aire acondicionado', '', 1, 'Capacitor de arranque para compresor o ventilador de equipos split. Consultanos con la marca y el modelo de tu aire.', '["Varias capacidades disponibles","Consultar según marca y modelo","Repuesto para unidad exterior e interior"]', '2026-01-01 00:00:26', '2026-01-01 00:00:26');

INSERT IGNORE INTO product_images (product_id, path, position) VALUES
  ('p01', 'assets/productos/heladeras.jpg', 0),
  ('p02', 'assets/productos/heladeras.jpg', 0),
  ('p03', 'assets/productos/freezer.jpg', 0),
  ('p04', 'assets/productos/freezer.jpg', 0),
  ('p05', 'assets/productos/lavarropas.jpg', 0),
  ('p06', 'assets/productos/lavarropas.jpg', 0),
  ('p07', 'assets/productos/secadoras.jpg', 0),
  ('p08', 'assets/productos/lavavajillas.jpg', 0),
  ('p09', 'assets/productos/coccion.jpg', 0),
  ('p10', 'assets/productos/coccion.jpg', 0),
  ('p11', 'assets/productos/campanas.jpg', 0),
  ('p12', 'assets/productos/aires-acondicionados.jpg', 0),
  ('p13', 'assets/productos/calefaccion.jpg', 0),
  ('p14', 'assets/productos/termotanques.jpg', 0),
  ('p15', 'assets/productos/smart-tv.jpg', 0),
  ('p16', 'assets/productos/colchones.jpg', 0),
  ('p17', 'assets/productos/pequenos-electrodomesticos.jpg', 0),
  ('p18', 'assets/productos/repuestos.jpg', 0),
  ('p19', 'assets/productos/repuestos.jpg', 0),
  ('p20', 'assets/productos/aires-acondicionados.jpg', 0),
  ('p21', 'assets/productos/aires-acondicionados.jpg', 0),
  ('p22', 'assets/productos/aires-acondicionados.jpg', 0),
  ('p23', 'assets/productos/calefaccion.jpg', 0),
  ('p24', 'assets/productos/calefaccion.jpg', 0),
  ('p25', 'assets/productos/calefaccion.jpg', 0),
  ('p26', 'assets/productos/heladeras.jpg', 0),
  ('p27', 'assets/productos/repuestos.jpg', 0);

SET FOREIGN_KEY_CHECKS = 1;
