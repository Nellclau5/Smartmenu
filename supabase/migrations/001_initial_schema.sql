-- Smart Menu — Schéma initial
-- Exécuter dans l'éditeur SQL Supabase ou via CLI

-- Table restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table menu_items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Plats', 'Boissons', 'Desserts')),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);

-- RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Gérant : CRUD sur son restaurant
CREATE POLICY "Users manage own restaurants"
  ON restaurants FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Gérant : CRUD sur les plats de son restaurant
CREATE POLICY "Users manage own menu items"
  ON menu_items FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE user_id = auth.uid()
    )
  );

-- Public : lecture des restaurants actifs
CREATE POLICY "Public read active restaurants"
  ON restaurants FOR SELECT
  USING (is_active = true);

-- Public : lecture des plats des restaurants actifs
CREATE POLICY "Public read menu items of active restaurants"
  ON menu_items FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE is_active = true
    )
  );
