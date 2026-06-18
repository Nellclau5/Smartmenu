-- ============================================================
-- Smart Menu — Installation complète (copier-coller dans Supabase SQL Editor)
-- Projet : https://supabase.com/dashboard/project/fmceuzptoqxmbihyixgz
-- ============================================================

-- 1. TABLES
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);

-- 2. RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own restaurants" ON restaurants;
CREATE POLICY "Users manage own restaurants"
  ON restaurants FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own menu items" ON menu_items;
CREATE POLICY "Users manage own menu items"
  ON menu_items FOR ALL
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  )
  WITH CHECK (
    restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Public read active restaurants" ON restaurants;
CREATE POLICY "Public read active restaurants"
  ON restaurants FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Public read menu items of active restaurants" ON menu_items;
CREATE POLICY "Public read menu items of active restaurants"
  ON menu_items FOR SELECT
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE is_active = true)
  );

-- 3. PLATS DE DÉMO + TRIGGER AUTO-RESTAURANT
CREATE OR REPLACE FUNCTION public.seed_sample_menu_items(p_restaurant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM menu_items WHERE restaurant_id = p_restaurant_id LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO menu_items (restaurant_id, category, name, description, price, is_available)
  VALUES
    (p_restaurant_id, 'Plats', 'Poulet Yassa', 'Mariné aux oignons et citron, servi avec du riz', 3500, true),
    (p_restaurant_id, 'Boissons', 'Bissap', 'Jus d''hibiscus frais', 1000, true),
    (p_restaurant_id, 'Desserts', 'Thiakry', 'Mil sucré à la vanille et raisins secs', 1500, true);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
BEGIN
  v_slug := 'resto-' || left(replace(NEW.id::text, '-', ''), 8);

  INSERT INTO restaurants (user_id, name, slug, is_active)
  VALUES (NEW.id, 'Mon Restaurant', v_slug, true);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
