-- Filtres diététiques pour la recherche côté client
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_spicy BOOLEAN NOT NULL DEFAULT false;
