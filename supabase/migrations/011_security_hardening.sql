-- Durcissement sécurité avant production

-- ─── 1. Commandes : retirer la lecture publique globale ───
DROP POLICY IF EXISTS "Public read orders for tracking" ON orders;
DROP POLICY IF EXISTS "Public read order items for tracking" ON order_items;

-- Suivi client : une seule commande par UUID (RPC)
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

  IF NOT EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = v_order.restaurant_id
      AND r.is_active = true
      AND (
        r.subscription_status = 'trial'
        OR (
          r.subscription_status = 'active'
          AND (r.subscription_expires_at IS NULL OR r.subscription_expires_at > now())
        )
      )
  ) THEN
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

REVOKE ALL ON FUNCTION public.get_order_for_tracking(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_for_tracking(UUID) TO anon, authenticated;

-- ─── 2. Abonnement : verrouiller colonnes sensibles ───
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
    NEW.subscription_expires_at := NULL;
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

DROP TRIGGER IF EXISTS trg_restaurants_protect_subscription ON restaurants;
CREATE TRIGGER trg_restaurants_protect_subscription
  BEFORE INSERT OR UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.restaurants_protect_subscription();

-- ─── 3. RPC abonnement : réservée au service role ───
REVOKE ALL ON FUNCTION public.activate_subscription_payment(TEXT, BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_subscription_payment(TEXT, BIGINT) FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.fail_subscription_payment(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_subscription_payment(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_subscription_payment(TEXT) TO service_role;

-- ─── 4. Commandes : abonnement actif + limites anti-abus ───
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
  IF NOT EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = p_restaurant_id
      AND r.is_active = true
      AND (
        r.subscription_status = 'trial'
        OR (
          r.subscription_status = 'active'
          AND (r.subscription_expires_at IS NULL OR r.subscription_expires_at > now())
        )
      )
  ) THEN
    RAISE EXCEPTION 'Restaurant introuvable ou inactif';
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

-- ─── 5. Activation abonnement : vérifier le montant attendu ───
DROP FUNCTION IF EXISTS public.activate_subscription_payment(TEXT, BIGINT);

CREATE OR REPLACE FUNCTION public.activate_subscription_payment(
  p_reference TEXT,
  p_geniuspay_id BIGINT DEFAULT NULL,
  p_paid_amount NUMERIC DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment subscription_payments%ROWTYPE;
  v_new_expires TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_payment
  FROM subscription_payments
  WHERE geniuspay_reference = p_reference
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_payment.status = 'completed' THEN
    RETURN TRUE;
  END IF;

  IF p_paid_amount IS NOT NULL AND abs(p_paid_amount - v_payment.amount) > 1 THEN
    RETURN FALSE;
  END IF;

  SELECT COALESCE(GREATEST(r.subscription_expires_at, now()), now()) + INTERVAL '30 days'
  INTO v_new_expires
  FROM restaurants r
  WHERE r.id = v_payment.restaurant_id;

  UPDATE subscription_payments
  SET
    status = 'completed',
    completed_at = now(),
    geniuspay_payment_id = COALESCE(p_geniuspay_id, geniuspay_payment_id)
  WHERE id = v_payment.id;

  UPDATE restaurants
  SET
    subscription_status = 'active',
    subscription_expires_at = v_new_expires,
    is_active = true
  WHERE id = v_payment.restaurant_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_subscription_payment(TEXT, BIGINT, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_subscription_payment(TEXT, BIGINT, NUMERIC) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_subscription_payment(TEXT, BIGINT, NUMERIC) TO service_role;
