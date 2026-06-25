import { NextResponse } from "next/server";
import {
  type GeniusPayWebhookPayload,
  verifyGeniusPayWebhookSignature,
} from "@/lib/geniuspay";
import { createAdminClient } from "@/lib/supabase/admin";

/** Webhook Genius Pay — activation abonnement sur payment.success */
export async function POST(request: Request) {
  const rawBody = await request.text();

  const signature = request.headers.get("X-Webhook-Signature");
  const timestamp = request.headers.get("X-Webhook-Timestamp");
  const event = request.headers.get("X-Webhook-Event");

  if (!verifyGeniusPayWebhookSignature(rawBody, signature, timestamp)) {
    return NextResponse.json({ detail: "Invalid signature" }, { status: 401 });
  }

  let payload: GeniusPayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as GeniusPayWebhookPayload;
  } catch {
    return NextResponse.json({ detail: "Invalid payload" }, { status: 400 });
  }

  const webhookEvent = event ?? payload.event;
  const reference = payload.data?.reference;

  if (!reference) {
    return NextResponse.json({ received: true });
  }

  const metadata = payload.data?.metadata;
  if (metadata?.type && metadata.type !== "subscription") {
    return NextResponse.json({ received: true, ignored: true });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ detail: "Server misconfigured" }, { status: 500 });
  }

  if (webhookEvent === "payment.success") {
    const paidAmount =
      typeof payload.data.amount === "number"
        ? payload.data.amount
        : Number(payload.data.amount);

    const { error } = await admin.rpc("activate_subscription_payment", {
      p_reference: reference,
      p_geniuspay_id: payload.data.id ?? null,
      p_paid_amount: Number.isFinite(paidAmount) ? paidAmount : null,
    });

    if (error) {
      return NextResponse.json({ detail: "Activation failed" }, { status: 500 });
    }
  } else if (
    webhookEvent === "payment.failed" ||
    webhookEvent === "payment.expired" ||
    webhookEvent === "payment.cancelled"
  ) {
    await admin.rpc("fail_subscription_payment", { p_reference: reference });
  }

  return NextResponse.json({ received: true });
}
