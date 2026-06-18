"use client";

import { useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRestaurant } from "@/components/dashboard/restaurant-context";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showBrowserNotification,
} from "@/lib/notifications";
import type { Order } from "@/lib/supabase/types";

const POLL_MS = 5000;

/** Écoute les nouvelles commandes et envoie une notification navigateur */
export function OrderNotifications() {
  const { id: restaurantId } = useRestaurant();
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  const checkOrders = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("id, table_number, customer_name, status, created_at")
      .eq("restaurant_id", restaurantId)
      .in("status", ["pending", "preparing"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (!data) return;

    const orders = data as Pick<Order, "id" | "table_number" | "customer_name" | "status">[];

    if (!initializedRef.current) {
      orders.forEach((o) => knownIdsRef.current.add(o.id));
      initializedRef.current = true;
      return;
    }

    for (const order of orders) {
      if (knownIdsRef.current.has(order.id)) continue;
      knownIdsRef.current.add(order.id);

      if (order.status !== "pending") continue;

      const who = order.customer_name ? ` — ${order.customer_name}` : "";
      showBrowserNotification("Nouvelle commande !", {
        body: `Table ${order.table_number}${who}`,
        tag: `order-${order.id}`,
        vibrate: [200, 100, 200],
      });
    }
  }, [restaurantId]);

  useEffect(() => {
    if (getNotificationPermission() === "default") {
      void requestNotificationPermission();
    }

    void checkOrders();
    const interval = setInterval(checkOrders, POLL_MS);

    const supabase = createClient();
    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const order = payload.new as Order;
          if (knownIdsRef.current.has(order.id)) return;
          knownIdsRef.current.add(order.id);

          const who = order.customer_name ? ` — ${order.customer_name}` : "";
          showBrowserNotification("Nouvelle commande !", {
            body: `Table ${order.table_number}${who}`,
            tag: `order-${order.id}`,
            vibrate: [200, 100, 200],
          });
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [restaurantId, checkOrders]);

  return null;
}
