-- Analytics menu : scans QR, vues plats, heures de pointe

CREATE TABLE IF NOT EXISTS menu_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('menu_scan', 'dish_view')),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_restaurant_created
  ON menu_analytics_events(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_restaurant_type_created
  ON menu_analytics_events(restaurant_id, event_type, created_at DESC);

ALTER TABLE menu_analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read own menu analytics" ON menu_analytics_events;
CREATE POLICY "Owners read own menu analytics"
  ON menu_analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = restaurant_id AND r.user_id = auth.uid()
    )
  );

-- Enregistrement public via RPC uniquement
CREATE OR REPLACE FUNCTION public.track_menu_event(
  p_restaurant_id UUID,
  p_event_type TEXT,
  p_menu_item_id UUID DEFAULT NULL,
  p_source TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source TEXT;
BEGIN
  IF p_event_type NOT IN ('menu_scan', 'dish_view') THEN
    RETURN false;
  END IF;

  IF NOT public.restaurant_has_active_subscription(p_restaurant_id) THEN
    RETURN false;
  END IF;

  IF p_event_type = 'dish_view' THEN
    IF p_menu_item_id IS NULL THEN
      RETURN false;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM menu_items
      WHERE id = p_menu_item_id
        AND restaurant_id = p_restaurant_id
        AND is_available = true
    ) THEN
      RETURN false;
    END IF;
  END IF;

  v_source := NULLIF(trim(left(COALESCE(p_source, ''), 32)), '');

  INSERT INTO menu_analytics_events (restaurant_id, event_type, menu_item_id, source)
  VALUES (p_restaurant_id, p_event_type, p_menu_item_id, v_source);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.track_menu_event(UUID, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_menu_event(UUID, TEXT, UUID, TEXT) TO anon, authenticated;

-- Agrégats pour le dashboard restaurateur
CREATE OR REPLACE FUNCTION public.get_restaurant_analytics(
  p_restaurant_id UUID,
  p_days INT DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_days INT := GREATEST(1, LEAST(COALESCE(p_days, 7), 90));
  v_since TIMESTAMPTZ := now() - (v_days || ' days')::INTERVAL;
  v_prev_start TIMESTAMPTZ := now() - (v_days * 2 || ' days')::INTERVAL;
  v_scans INT;
  v_scans_prev INT;
  v_dish_views INT;
  v_top_dishes JSONB;
  v_peak_hours JSONB;
  v_peak_days JSONB;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM restaurants r
    WHERE r.id = p_restaurant_id AND r.user_id = v_user
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT COUNT(*)::INT INTO v_scans
  FROM menu_analytics_events
  WHERE restaurant_id = p_restaurant_id
    AND event_type = 'menu_scan'
    AND created_at >= v_since;

  SELECT COUNT(*)::INT INTO v_scans_prev
  FROM menu_analytics_events
  WHERE restaurant_id = p_restaurant_id
    AND event_type = 'menu_scan'
    AND created_at >= v_prev_start
    AND created_at < v_since;

  SELECT COUNT(*)::INT INTO v_dish_views
  FROM menu_analytics_events
  WHERE restaurant_id = p_restaurant_id
    AND event_type = 'dish_view'
    AND created_at >= v_since;

  SELECT COALESCE(
    (
      SELECT jsonb_agg(row_data ORDER BY (row_data->>'views')::INT DESC)
      FROM (
        SELECT jsonb_build_object(
          'menu_item_id', e.menu_item_id,
          'name', mi.name,
          'views', COUNT(*)::INT,
          'share_pct', CASE
            WHEN v_dish_views > 0 THEN
              ROUND((COUNT(*)::NUMERIC / v_dish_views) * 100)::INT
            ELSE 0
          END
        ) AS row_data
        FROM menu_analytics_events e
        JOIN menu_items mi ON mi.id = e.menu_item_id
        WHERE e.restaurant_id = p_restaurant_id
          AND e.event_type = 'dish_view'
          AND e.created_at >= v_since
        GROUP BY e.menu_item_id, mi.name
        ORDER BY COUNT(*) DESC
        LIMIT 8
      ) top_rows
    ),
    '[]'::jsonb
  )
  INTO v_top_dishes;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'hour', h,
        'count', COALESCE(c.cnt, 0)
      )
      ORDER BY h
    ),
    '[]'::jsonb
  )
  INTO v_peak_hours
  FROM generate_series(0, 23) AS h
  LEFT JOIN (
    SELECT
      EXTRACT(HOUR FROM created_at AT TIME ZONE 'Africa/Abidjan')::INT AS hour,
      COUNT(*)::INT AS cnt
    FROM menu_analytics_events
    WHERE restaurant_id = p_restaurant_id
      AND event_type = 'menu_scan'
      AND created_at >= v_since
    GROUP BY 1
  ) c ON c.hour = h;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'day', d,
        'count', COALESCE(c.cnt, 0)
      )
      ORDER BY d
    ),
    '[]'::jsonb
  )
  INTO v_peak_days
  FROM generate_series(0, 6) AS d
  LEFT JOIN (
    SELECT
      EXTRACT(DOW FROM created_at AT TIME ZONE 'Africa/Abidjan')::INT AS day,
      COUNT(*)::INT AS cnt
    FROM menu_analytics_events
    WHERE restaurant_id = p_restaurant_id
      AND event_type = 'menu_scan'
      AND created_at >= v_since
    GROUP BY 1
  ) c ON c.day = d;

  RETURN jsonb_build_object(
    'period_days', v_days,
    'scans_total', v_scans,
    'scans_previous_period', v_scans_prev,
    'dish_views_total', v_dish_views,
    'top_dishes', v_top_dishes,
    'peak_hours', v_peak_hours,
    'peak_days', v_peak_days
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_restaurant_analytics(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_restaurant_analytics(UUID, INT) TO authenticated;
