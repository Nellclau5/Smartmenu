-- Suppression automatique des commandes terminées après 24 h (option restaurateur)

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS auto_delete_orders_after_24h BOOLEAN NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Owners delete own orders" ON orders;
CREATE POLICY "Owners delete own orders"
  ON orders FOR DELETE
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.purge_old_orders(p_restaurant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM restaurants r
    WHERE r.id = p_restaurant_id
      AND r.user_id = auth.uid()
      AND r.auto_delete_orders_after_24h = true
  ) THEN
    RETURN 0;
  END IF;

  WITH deleted AS (
    DELETE FROM orders o
    WHERE o.restaurant_id = p_restaurant_id
      AND o.status IN ('completed', 'cancelled')
      AND o.created_at < now() - interval '24 hours'
    RETURNING o.id
  )
  SELECT count(*)::INTEGER INTO v_deleted FROM deleted;

  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_old_orders(UUID) TO authenticated;
