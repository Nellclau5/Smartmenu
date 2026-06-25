import { createHmac, timingSafeEqual } from "crypto";

const GENIUSPAY_API_BASE = "https://geniuspay.ci/api/v1/merchant";

export interface GeniusPayCustomer {
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
}

export interface CreatePaymentInput {
  amount: number;
  description: string;
  customer?: GeniusPayCustomer;
  success_url?: string;
  error_url?: string;
  metadata?: Record<string, string>;
}

export interface GeniusPayPaymentData {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  checkout_url?: string;
  payment_url?: string;
  metadata?: Record<string, string>;
  environment?: string;
}

interface GeniusPayResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

function getGeniusPayCredentials() {
  const apiKey = process.env.GENIUSPAY_API_KEY;
  const apiSecret = process.env.GENIUSPAY_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Clés Genius Pay non configurées");
  }

  return { apiKey, apiSecret };
}

async function geniusPayFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<GeniusPayResponse<T>> {
  const { apiKey, apiSecret } = getGeniusPayCredentials();

  const response = await fetch(`${GENIUSPAY_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      "X-API-Secret": apiSecret,
      ...(options.headers ?? {}),
    },
  });

  const body = (await response.json()) as GeniusPayResponse<T>;

  if (!response.ok) {
    throw new Error(body.message ?? body.error ?? "Erreur Genius Pay");
  }

  return body;
}

/** Crée un paiement checkout (sans payment_method) */
export async function createGeniusPayPayment(
  input: CreatePaymentInput
): Promise<GeniusPayPaymentData> {
  const result = await geniusPayFetch<GeniusPayPaymentData>("/payments", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amount,
      currency: "XOF",
      description: input.description,
      customer: input.customer,
      success_url: input.success_url,
      error_url: input.error_url,
      metadata: input.metadata,
    }),
  });

  if (!result.data?.reference) {
    throw new Error("Réponse Genius Pay invalide");
  }

  return result.data;
}

/** Récupère le statut d'un paiement par référence */
export async function getGeniusPayPayment(
  reference: string
): Promise<GeniusPayPaymentData | null> {
  try {
    const result = await geniusPayFetch<GeniusPayPaymentData>(
      `/payments/${encodeURIComponent(reference)}`
    );
    return result.data ?? null;
  } catch {
    return null;
  }
}

function hmacMatches(secret: string, data: string, signature: string): boolean {
  const expected = createHmac("sha256", secret).update(data).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function verifyGeniusPayWebhookSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !timestamp) return false;

  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) return false;

  const candidates = [rawBody];
  try {
    candidates.push(JSON.stringify(JSON.parse(rawBody)));
  } catch {
    return false;
  }

  return candidates.some((body) =>
    hmacMatches(secret, `${timestamp}.${body}`, signature)
  );
}

export interface GeniusPayWebhookPayload {
  event: string;
  data: {
    reference: string;
    id?: number;
    amount?: number;
    status?: string;
    metadata?: Record<string, string>;
  };
}
