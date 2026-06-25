-- Permet au restaurateur connecté d'enregistrer son paiement en attente (checkout)
CREATE POLICY "Users insert own subscription payments"
  ON subscription_payments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );
