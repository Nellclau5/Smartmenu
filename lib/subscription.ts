import type { Restaurant, SubscriptionStatus } from "@/lib/supabase/types";

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

/** Statut effectif (prend en compte la date d'expiration) */
export function getEffectiveSubscriptionStatus(
  restaurant: Pick<Restaurant, "subscription_status" | "subscription_expires_at">
): SubscriptionStatus {
  if (
    restaurant.subscription_status === "active" &&
    restaurant.subscription_expires_at &&
    new Date(restaurant.subscription_expires_at) < new Date()
  ) {
    return "expired";
  }
  return restaurant.subscription_status;
}

export function formatExpiryDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Menu public accessible (essai ou abonnement actif non expiré) */
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
