import { NextResponse } from "next/server";
import { getGeniusPayPayment } from "@/lib/geniuspay";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface ConfirmBody {
  reference?: string;
}

/** Confirme un paiement après retour checkout (secours si webhook retardé) */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    let body: ConfirmBody = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
    }

    const reference = body.reference?.trim();
    if (!reference) {
      return NextResponse.json({ error: "Référence requise" }, { status: 400 });
    }

    const { data: localPayment } = await supabase
      .from("subscription_payments")
      .select("id, status, restaurant_id")
      .eq("geniuspay_reference", reference)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!localPayment) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    if (localPayment.status === "completed") {
      return NextResponse.json({ status: "completed", already: true });
    }

    const remote = await getGeniusPayPayment(reference);
    if (!remote || remote.status !== "completed") {
      return NextResponse.json({ status: remote?.status ?? "pending" });
    }

    const admin = createAdminClient();
    const { data: activated, error } = await admin.rpc("activate_subscription_payment", {
      p_reference: reference,
      p_geniuspay_id: remote.id,
      p_paid_amount: remote.amount,
    });

    if (error) {
      return NextResponse.json({ error: "Activation impossible" }, { status: 500 });
    }

    return NextResponse.json({
      status: "completed",
      activated: Boolean(activated),
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
