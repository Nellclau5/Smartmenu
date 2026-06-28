import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import type { TrackMenuEventBody } from "@/lib/supabase/types";

/** Enregistre un scan menu ou une vue plat (RPC sécurisée) */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`analytics:${ip}`, { windowMs: 60_000, max: 60 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec ?? 60) } }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
  }

  let body: TrackMenuEventBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { restaurant_id, event_type, menu_item_id, source } = body;

  if (!restaurant_id || !event_type) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  if (event_type !== "menu_scan" && event_type !== "dish_view") {
    return NextResponse.json({ error: "Type d'événement invalide" }, { status: 400 });
  }

  if (event_type === "dish_view" && !menu_item_id) {
    return NextResponse.json({ error: "Plat requis" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.rpc("track_menu_event", {
    p_restaurant_id: restaurant_id,
    p_event_type: event_type,
    p_menu_item_id: menu_item_id ?? null,
    p_source: source?.trim().slice(0, 32) ?? null,
  });

  if (error) {
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 400 });
  }

  return NextResponse.json({ ok: data === true });
}
