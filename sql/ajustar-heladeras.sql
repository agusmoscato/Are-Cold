-- Heladeras: subcategorías según la nota del cliente: "Sin freezer", "Cíclicas", "No Frost".
-- Correr DESPUÉS de limpiar-datos-demo.sql (que borra los productos de ejemplo de Heladeras).
-- Se puede repetir sin problema.

-- Vista previa: productos que usan las subcategorías viejas. Debería dar 0 filas.
-- Si da filas, NO seguir: avisar antes de reasignarlos.
-- SELECT p.id, p.name, s.name AS subcategoria FROM products p JOIN subcategories s ON s.id = p.subcategory_id JOIN categories c ON c.id = s.category_id WHERE c.slug = 'heladeras' AND s.slug IN ('con-freezer', 'exhibidoras');

-- "No frost" ya existe: se conserva el identificador y se corrige el nombre
UPDATE subcategories s JOIN categories c ON c.id = s.category_id
   SET s.name = 'No Frost', s.position = 2 WHERE c.slug = 'heladeras' AND s.slug = 'no-frost';

INSERT IGNORE INTO subcategories (category_id, slug, name, position) SELECT id, 'sin-freezer', 'Sin freezer', 0 FROM categories WHERE slug = 'heladeras';
INSERT IGNORE INTO subcategories (category_id, slug, name, position) SELECT id, 'ciclicas', 'Cíclicas', 1 FROM categories WHERE slug = 'heladeras';

-- Las viejas se borran solo si ningún producto las usa
DELETE s FROM subcategories s JOIN categories c ON c.id = s.category_id
 WHERE c.slug = 'heladeras' AND s.slug IN ('con-freezer', 'exhibidoras')
   AND NOT EXISTS (SELECT 1 FROM products p WHERE p.subcategory_id = s.id);
