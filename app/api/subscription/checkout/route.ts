import { NextResponse } from "next/server";
import { getAppUrlFromRequest } from "@/lib/app-url";
import { createGeniusPayPayment } from "@/lib/geniuspay";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  SUBSCRIPTION_PLAN,
  formatPriceXof,
  getSubscriptionPriceXof,
} from "@/lib/subscription";

/** Initie un paiement Genius Pay pour l'abonnement mensuel */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`checkout:${ip}`, { windowMs: 60_000, max: 10 });
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez plus tard." },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id, name, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
    }

    const amount = getSubscriptionPriceXof();
    const appUrl = getAppUrlFromRequest(request);
    const description = `Smart Menu — ${SUBSCRIPTION_PLAN.label} (${formatPriceXof(amount)})`;

    const payment = await createGeniusPayPayment({
      amount,
      description,
      customer: {
        name: restaurant.name,
        email: user.email ?? undefined,
      },
      success_url: `${appUrl}/dashboard/subscription?status=success`,
      error_url: `${appUrl}/dashboard/subscription?status=error`,
      metadata: {
        restaurant_id: restaurant.id,
        user_id: user.id,
        plan: SUBSCRIPTION_PLAN.id,
        type: "subscription",
      },
    });

    const checkoutUrl = payment.checkout_url ?? payment.payment_url;
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "URL de paiement indisponible" },
        { status: 502 }
      );
    }

    const { error: insertError } = await supabase.from("subscription_payments").insert({
      restaurant_id: restaurant.id,
      user_id: user.id,
      geniuspay_reference: payment.reference,
      geniuspay_payment_id: payment.id,
      amount,
      currency: payment.currency ?? "XOF",
      status: "pending",
      plan: SUBSCRIPTION_PLAN.id,
      metadata: {
        restaurant_id: restaurant.id,
        user_id: user.id,
        plan: SUBSCRIPTION_PLAN.id,
      },
    });

    if (insertError) {
      const detail =
        process.env.NODE_ENV === "development" ? insertError.message : undefined;
      return NextResponse.json(
        {
          error: detail?.includes("subscription_payments")
            ? "Table abonnements absente — exécutez la migration 009 dans Supabase"
            : "Impossible d'enregistrer le paiement",
          ...(detail ? { detail } : {}),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkout_url: checkoutUrl,
      reference: payment.reference,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
