-- Essai gratuit 14 jours puis abonnement requis

CREATE OR REPLACE FUNCTION public.restaurants_protect_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (auth.jwt() ->> 'role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.subscription_status := 'trial';
    NEW.subscription_expires_at := now() + INTERVAL '14 days';
    RETURN NEW;
  END IF;

  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
    NEW.subscription_status := OLD.subscription_status;
  END IF;

  IF NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at THEN
    NEW.subscription_expires_at := OLD.subscription_expires_at;
  END IF;

  RETURN NEW;
END;
$$;

-- Restaurants en essai sans date : +14 jours depuis la création
UPDATE restaurants
SET subscription_expires_at = created_at + INTERVAL '14 days'
WHERE subscription_status = 'trial'
  AND subscription_expires_at IS NULL;

-- Helper : abonnement utilisable (essai ou actif non expiré)
CREATE OR REPLACE FUNCTION public.restaurant_has_active_subscription(p_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = p_restaurant_id
      AND r.is_active = true
      AND (
        (
          r.subscription_status = 'trial'
          AND (r.subscription_expires_at IS NULL OR r.subscription_expires_at > now())
        )
        OR (
          r.subscription_status = 'active'
          AND (r.subscription_expires_at IS NULL OR r.subscription_expires_at > now())
        )
      )
  );
$$;

-- Mise à jour create_menu_order : essai expiré = refus commandes
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
  v_item_count INT;
BEGIN
  IF NOT public.restaurant_has_active_subscription(p_restaurant_id) THEN
    RAISE EXCEPTION 'Restaurant introuvable ou abonnement expiré';
  END IF;

  IF p_table_number IS NULL OR length(trim(p_table_number)) = 0 OR length(trim(p_table_number)) > 20 THEN
    RAISE EXCEPTION 'Numéro de table invalide';
  END IF;

  IF p_customer_name IS NOT NULL AND length(trim(p_customer_name)) > 100 THEN
    RAISE EXCEPTION 'Nom client trop long';
  END IF;

  IF p_notes IS NOT NULL AND length(trim(p_notes)) > 500 THEN
    RAISE EXCEPTION 'Notes trop longues';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Panier vide';
  END IF;

  v_item_count := jsonb_array_length(p_items);
  IF v_item_count > 30 THEN
    RAISE EXCEPTION 'Panier trop volumineux';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INT;
    IF v_qty IS NULL OR v_qty < 1 OR v_qty > 99 THEN
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

-- Suivi commande : même règle d'abonnement
CREATE OR REPLACE FUNCTION public.get_order_for_tracking(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_items JSONB;
BEGIN
  IF p_order_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF NOT public.restaurant_has_active_subscription(v_order.restaurant_id) THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', oi.id,
        'order_id', oi.order_id,
        'menu_item_id', oi.menu_item_id,
        'item_name', oi.item_name,
        'unit_price', oi.unit_price,
        'quantity', oi.quantity,
        'line_total', oi.line_total
      )
      ORDER BY oi.item_name
    ),
    '[]'::jsonb
  )
  INTO v_items
  FROM order_items oi
  WHERE oi.order_id = p_order_id;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'restaurant_id', v_order.restaurant_id,
    'table_number', v_order.table_number,
    'customer_name', v_order.customer_name,
    'notes', v_order.notes,
    'status', v_order.status,
    'total_amount', v_order.total_amount,
    'created_at', v_order.created_at,
    'order_items', v_items
  );
END;
$$;
