-- Catégories personnalisées + suivi commande client

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS menu_categories JSONB NOT NULL
  DEFAULT '["Entrées","Plats","Desserts","Boissons"]'::jsonb;

ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_category_check;

-- Suivi commande côté client (UUID comme clé secrète)
DROP POLICY IF EXISTS "Public read orders for tracking" ON orders;
CREATE POLICY "Public read orders for tracking"
  ON orders FOR SELECT
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE is_active = true)
  );

DROP POLICY IF EXISTS "Public read order items for tracking" ON order_items;
CREATE POLICY "Public read order items for tracking"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE o.restaurant_id IN (
        SELECT id FROM restaurants WHERE is_active = true
      )
    )
  );

ALTER TABLE orders REPLICA IDENTITY FULL;
