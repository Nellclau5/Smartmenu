-- Menu vide à la création de compte (plus de plats de démo automatiques)

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
