import type { MenuAnalyticsEventType } from "@/lib/supabase/types";

const SCAN_SESSION_PREFIX = "sm-scan-";
const DISH_SESSION_PREFIX = "sm-dish-";

async function postTrackEvent(payload: {
  restaurant_id: string;
  event_type: MenuAnalyticsEventType;
  menu_item_id?: string;
  source?: string;
}): Promise<void> {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Analytics non bloquante
  }
}

/** Un scan par session navigateur */
export function trackMenuScan(restaurantId: string, source?: string): void {
  if (typeof window === "undefined") return;

  const sessionKey = `${SCAN_SESSION_PREFIX}${restaurantId}`;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, "1");

  void postTrackEvent({
    restaurant_id: restaurantId,
    event_type: "menu_scan",
    source,
  });
}

/** Une vue par plat et par session */
export function trackDishView(restaurantId: string, menuItemId: string): void {
  if (typeof window === "undefined") return;

  const sessionKey = `${DISH_SESSION_PREFIX}${restaurantId}-${menuItemId}`;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, "1");

  void postTrackEvent({
    restaurant_id: restaurantId,
    event_type: "dish_view",
    menu_item_id: menuItemId,
  });
}
