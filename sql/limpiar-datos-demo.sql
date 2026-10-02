-- Limpieza de datos de EJEMPLO de la demo. Generado con: node sql/limpiar-datos-demo.js
-- Importar en phpMyAdmin. Antes, mirar la vista previa (SELECT) para confirmar qué se va a borrar.

-- ===== 1. VISTA PREVIA: qué se borraría (ejecutar solo este SELECT si querés revisar antes) =====
-- SELECT id, name, active FROM products WHERE (id, name) IN (('p01', 'Heladera con freezer superior'), ('p02', 'Heladera cíclica una puerta'), ('p03', 'Freezer horizontal'), ('p04', 'Freezer vertical'), ('p05', 'Lavarropas carga frontal'), ('p06', 'Lavarropas carga superior'), ('p07', 'Secarropas a condensación'), ('p08', 'Lavavajillas empotrable'), ('p09', 'Cocina a gas de 4 hornallas'), ('p10', 'Anafe eléctrico dos hornallas'), ('p11', 'Campana de cocina'), ('p12', 'Aire acondicionado split frío/calor'), ('p13', 'Calefactor tiro balanceado'), ('p14', 'Termotanque a gas'), ('p15', 'Smart TV 50 pulgadas'), ('p16', 'Colchón de resortes pocket'), ('p17', 'Microondas con grill'), ('p18', 'Burlete para heladera'), ('p19', 'Motor de lavarropas'), ('p20', 'Aire acondicionado split solo frío'), ('p21', 'Aire acondicionado portátil'), ('p22', 'Aire acondicionado de ventana'), ('p23', 'Estufa a gas con salida al exterior'), ('p24', 'Estufa eléctrica de cuarzo'), ('p25', 'Panel calefactor infrarrojo'), ('p26', 'Heladera no frost'), ('p27', 'Capacitor para aire acondicionado'));

-- ===== 2. Productos de ejemplo (mismo id y mismo nombre). Sus fotos se borran en cascada =====
DELETE FROM products WHERE (id, name) IN (('p01', 'Heladera con freezer superior'), ('p02', 'Heladera cíclica una puerta'), ('p03', 'Freezer horizontal'), ('p04', 'Freezer vertical'), ('p05', 'Lavarropas carga frontal'), ('p06', 'Lavarropas carga superior'), ('p07', 'Secarropas a condensación'), ('p08', 'Lavavajillas empotrable'), ('p09', 'Cocina a gas de 4 hornallas'), ('p10', 'Anafe eléctrico dos hornallas'), ('p11', 'Campana de cocina'), ('p12', 'Aire acondicionado split frío/calor'), ('p13', 'Calefactor tiro balanceado'), ('p14', 'Termotanque a gas'), ('p15', 'Smart TV 50 pulgadas'), ('p16', 'Colchón de resortes pocket'), ('p17', 'Microondas con grill'), ('p18', 'Burlete para heladera'), ('p19', 'Motor de lavarropas'), ('p20', 'Aire acondicionado split solo frío'), ('p21', 'Aire acondicionado portátil'), ('p22', 'Aire acondicionado de ventana'), ('p23', 'Estufa a gas con salida al exterior'), ('p24', 'Estufa eléctrica de cuarzo'), ('p25', 'Panel calefactor infrarrojo'), ('p26', 'Heladera no frost'), ('p27', 'Capacitor para aire acondicionado'));

-- ===== 3. Mismo id pero nombre distinto: pudo ser editado a mano → se deja INACTIVO para revisar =====
UPDATE products SET active = 0 WHERE id IN ('p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08', 'p09', 'p10', 'p11', 'p12', 'p13', 'p14', 'p15', 'p16', 'p17', 'p18', 'p19', 'p20', 'p21', 'p22', 'p23', 'p24', 'p25', 'p26', 'p27');

-- ===== 4. Subcategorías de ejemplo de Cocción (reemplazadas por las del lote real) =====
-- Los productos que las usaran quedan sin subcategoría (ON DELETE SET NULL), no se borran.
DELETE s FROM subcategories s JOIN categories c ON c.id = s.category_id WHERE c.slug = 'coccion' AND s.slug IN ('cocinas', 'anafes');

-- ===== 5. A CONFIRMAR: subcategorías inventadas que quedan (Freezer) para la demo (no se borran solas) =====
-- Si no las vas a usar, descomentá las líneas para borrarlas:
-- DELETE s FROM subcategories s JOIN categories c ON c.id = s.category_id WHERE c.slug = 'freezer' AND s.slug = 'horizontal'; -- Freezer › Horizontal
-- DELETE s FROM subcategories s JOIN categories c ON c.id = s.category_id WHERE c.slug = 'freezer' AND s.slug = 'vertical'; -- Freezer › Vertical
