-- Abonnements restaurateur via Genius Pay

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'expired'));

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  geniuspay_reference TEXT UNIQUE NOT NULL,
  geniuspay_payment_id BIGINT,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  plan TEXT NOT NULL DEFAULT 'monthly',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_restaurant
  ON subscription_payments(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_reference
  ON subscription_payments(geniuspay_reference);

CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_expires
  ON restaurants(subscription_expires_at)
  WHERE subscription_status = 'active';

ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscription payments"
  ON subscription_payments FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- Activation abonnement (appelée par webhook / confirmation serveur)
CREATE OR REPLACE FUNCTION activate_subscription_payment(
  p_reference TEXT,
  p_geniuspay_id BIGINT DEFAULT NULL
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

CREATE OR REPLACE FUNCTION fail_subscription_payment(p_reference TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscription_payments
  SET status = 'failed'
  WHERE geniuspay_reference = p_reference
    AND status = 'pending';

  RETURN FOUND;
END;
$$;
