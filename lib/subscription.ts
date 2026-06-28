import type { Restaurant, SubscriptionStatus } from "@/lib/supabase/types";

export const TRIAL_DAYS = 14;

export const SUBSCRIPTION_PLAN = {
  id: "monthly" as const,
  label: "Abonnement mensuel",
  durationDays: 30,
};

export function getSubscriptionPriceXof(): number {
  const raw = process.env.SUBSCRIPTION_PRICE_XOF ?? "7500";
  const price = Number.parseInt(raw, 10);
  return Number.isFinite(price) && price >= 200 ? price : 7500;
}

export function formatPriceXof(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function isPast(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

/** Statut effectif (essai 14j ou abonnement actif) */
export function getEffectiveSubscriptionStatus(
  restaurant: Pick<Restaurant, "subscription_status" | "subscription_expires_at">
): SubscriptionStatus {
  if (restaurant.subscription_status === "active") {
    if (isPast(restaurant.subscription_expires_at)) return "expired";
    return "active";
  }

  if (restaurant.subscription_status === "trial") {
    if (isPast(restaurant.subscription_expires_at)) return "expired";
    return "trial";
  }

  return restaurant.subscription_status;
}

export function getTrialDaysRemaining(
  expiresAt: string | null | undefined
): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatExpiryDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Menu public accessible */
export function isRestaurantMenuPublic(
  restaurant: Pick<
    Restaurant,
    "is_active" | "subscription_status" | "subscription_expires_at"
  >
): boolean {
  if (!restaurant.is_active) return false;
  const status = getEffectiveSubscriptionStatus(restaurant);
  return status === "trial" || status === "active";
}

export function requiresSubscription(
  restaurant: Pick<Restaurant, "subscription_status" | "subscription_expires_at">
): boolean {
  return getEffectiveSubscriptionStatus(restaurant) === "expired";
}
