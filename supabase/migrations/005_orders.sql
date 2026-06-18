-- Commandes clients — panier depuis le menu public

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  customer_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  total_amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Restaurateur : lecture et mise à jour de ses commandes
CREATE POLICY "Owners read own orders"
  ON orders FOR SELECT
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

CREATE POLICY "Owners update own orders"
  ON orders FOR UPDATE
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  )
  WITH CHECK (
    restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

CREATE POLICY "Owners read own order items"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE o.restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
    )
  );

-- Création atomique côté serveur (validation prix + disponibilité)
CREATE OR REPLACE FUNCTION public.create_menu_order(
  p_restaurant_id UUID,
  p_table_number TEXT,
  p_customer_name TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_total NUMERIC(10, 2) := 0;
  v_item JSONB;
  v_menu_item menu_items%ROWTYPE;
  v_qty INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM restaurants WHERE id = p_restaurant_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Restaurant introuvable ou inactif';
  END IF;

  IF p_table_number IS NULL OR trim(p_table_number) = '' THEN
    RAISE EXCEPTION 'Numéro de table requis';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Panier vide';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INT;
    IF v_qty IS NULL OR v_qty < 1 THEN
      RAISE EXCEPTION 'Quantité invalide';
    END IF;

    SELECT * INTO v_menu_item
    FROM menu_items
    WHERE id = (v_item->>'menu_item_id')::UUID
      AND restaurant_id = p_restaurant_id
      AND is_available = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Plat indisponible ou introuvable';
    END IF;

    v_total := v_total + (v_menu_item.price * v_qty);
  END LOOP;

  INSERT INTO orders (
    restaurant_id, table_number, customer_name, notes, total_amount, status
  )
  VALUES (
    p_restaurant_id,
    trim(p_table_number),
    NULLIF(trim(p_customer_name), ''),
    NULLIF(trim(p_notes), ''),
    v_total,
    'pending'
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INT;

    SELECT * INTO v_menu_item
    FROM menu_items
    WHERE id = (v_item->>'menu_item_id')::UUID
      AND restaurant_id = p_restaurant_id;

    INSERT INTO order_items (
      order_id, menu_item_id, item_name, unit_price, quantity, line_total
    )
    VALUES (
      v_order_id,
      v_menu_item.id,
      v_menu_item.name,
      v_menu_item.price,
      v_qty,
      v_menu_item.price * v_qty
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_menu_order TO anon, authenticated;
