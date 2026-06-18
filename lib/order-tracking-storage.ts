const KEY_PREFIX = "smartmenu-track-";

/** Enregistre une commande pour le suivi client (localStorage) */
export function saveTrackedOrder(slug: string, orderId: string) {
  if (typeof window === "undefined") return;
  const orders = getTrackedOrders(slug).filter((id) => id !== orderId);
  orders.unshift(orderId);
  localStorage.setItem(KEY_PREFIX + slug, JSON.stringify(orders.slice(0, 5)));
}

/** Commandes récentes enregistrées pour ce restaurant */
export function getTrackedOrders(slug: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_PREFIX + slug);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}
