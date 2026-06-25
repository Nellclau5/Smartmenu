import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import type { CartLineInput } from "@/lib/supabase/types";

interface OrderBody {
  restaurant_id: string;
  table_number: string;
  customer_name?: string;
  notes?: string;
  items: CartLineInput[];
}

/** Crée une commande client via RPC Supabase (prix validés côté DB) */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`orders:${ip}`, { windowMs: 60_000, max: 15 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de commandes. Réessayez dans quelques instants." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec ?? 60) } }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 });
  }

  let body: OrderBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { restaurant_id, table_number, customer_name, notes, items } = body;

  if (!restaurant_id || !table_number?.trim() || table_number.trim().length > 20) {
    return NextResponse.json(
      { error: "Restaurant et numéro de table requis" },
      { status: 400 }
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Panier vide" }, { status: 400 });
  }

  const sanitizedItems = items
    .filter((i) => i.menu_item_id && i.quantity > 0)
    .map((i) => ({
      menu_item_id: i.menu_item_id,
      quantity: Math.min(Math.floor(i.quantity), 99),
    }));

  if (sanitizedItems.length === 0) {
    return NextResponse.json({ error: "Panier invalide" }, { status: 400 });
  }

  if (sanitizedItems.length > 30) {
    return NextResponse.json({ error: "Panier trop volumineux" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: orderId, error } = await supabase.rpc("create_menu_order", {
    p_restaurant_id: restaurant_id,
    p_table_number: table_number.trim(),
    p_customer_name: customer_name?.trim() || null,
    p_notes: notes?.trim() || null,
    p_items: sanitizedItems,
  });

  if (error) {
    const message =
      error.message.includes("indisponible") || error.message.includes("introuvable")
        ? "Un plat de votre panier n'est plus disponible"
        : error.message.includes("table")
          ? "Indiquez votre numéro de table"
          : "Impossible d'envoyer la commande. Réessayez.";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ order_id: orderId });
}
