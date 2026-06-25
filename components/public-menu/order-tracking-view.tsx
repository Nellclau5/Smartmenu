"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChefHat, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotificationEnableBanner } from "@/components/notifications/notification-enable-banner";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  getNotificationPermission,
  notifyUser,
} from "@/lib/notifications";
import {
  ORDER_STATUS_LABELS,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "@/lib/supabase/types";

const POLL_MS = 4000;

const STEPS: { status: OrderStatus; label: string; icon: typeof Clock }[] = [
  { status: "pending", label: "Reçue", icon: Clock },
  { status: "preparing", label: "En préparation", icon: ChefHat },
  { status: "ready", label: "Prête", icon: Package },
  { status: "completed", label: "Servie", icon: CheckCircle2 },
];

interface OrderTrackingViewProps {
  slug: string;
  orderId: string;
  restaurantName: string;
}

/** Suivi commande client avec notifications quand prête */
export function OrderTrackingView({
  slug,
  orderId,
  restaurantName,
}: OrderTrackingViewProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const lastStatusRef = useRef<OrderStatus | null>(null);
  const readyNotifiedRef = useRef(false);

  const fetchOrder = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_order_for_tracking", {
      p_order_id: orderId,
    });

    if (!error && data) {
      const next = data as Order;
      const prevStatus = lastStatusRef.current;

      if (prevStatus && prevStatus !== next.status) {
        if (next.status === "preparing") {
          void notifyUser(
            {
              title: "Commande en préparation",
              body: `${restaurantName} prépare votre commande.`,
              tag: `track-${orderId}`,
            },
            { sound: true, inApp: true }
          );
        }
        if (next.status === "ready" && !readyNotifiedRef.current) {
          readyNotifiedRef.current = true;
          void notifyUser(
            {
              title: "Votre commande est prête !",
              body: `Récupérez-la à la table ${next.table_number}.`,
              tag: `track-ready-${orderId}`,
              vibrate: [300, 150, 300, 150, 300],
            },
            { sound: true, inApp: true }
          );
        }
        if (next.status === "cancelled") {
          void notifyUser(
            {
              title: "Commande annulée",
              body: "Contactez le restaurant pour plus d'informations.",
              tag: `track-cancel-${orderId}`,
            },
            { sound: false, inApp: true }
          );
        }
      }

      lastStatusRef.current = next.status;
      setOrder(next);
    }
    setLoading(false);
  }, [orderId, restaurantName]);

  useEffect(() => {
    setNotifEnabled(getNotificationPermission() === "granted");
    void fetchOrder();
    const interval = setInterval(fetchOrder, POLL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [orderId, fetchOrder]);

  useEffect(() => {
    const sync = () => setNotifEnabled(getNotificationPermission() === "granted");
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-muted-foreground">Chargement de votre commande…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-medium">Commande introuvable</p>
        <Button asChild>
          <Link href={`/menu/${slug}`}>Retour au menu</Link>
        </Button>
      </div>
    );
  }

  const items = (order.order_items ?? []) as OrderItem[];
  const currentStep = STEPS.findIndex((s) => s.status === order.status);

  return (
    <div className="min-h-dvh bg-background px-4 py-8 safe-top safe-bottom">
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Suivi de commande</h1>
          <p className="text-muted-foreground text-sm mt-1">{restaurantName}</p>
          <p className="text-sm mt-2">
            Table <span className="font-bold">{order.table_number}</span>
          </p>
        </div>

        <Card className="shadow-sm overflow-hidden">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Badge
                className={cn(
                  "text-sm",
                  order.status === "ready" && "bg-emerald-600 text-white",
                  order.status === "cancelled" && "bg-destructive text-white"
                )}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
              <span className="font-bold text-primary">
                {formatPrice(Number(order.total_amount))}
              </span>
            </div>

            {order.status !== "cancelled" && (
              <ol className="space-y-3">
                {STEPS.map((step, idx) => {
                  const done = currentStep >= idx && order.status !== "cancelled";
                  const active = STEPS[currentStep]?.status === step.status;
                  const Icon = step.icon;
                  return (
                    <li
                      key={step.status}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2",
                        active && "bg-primary/10",
                        done && !active && "opacity-70"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full",
                          done ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={cn("font-medium text-sm", active && "text-primary")}>
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            <ul className="border-t pt-3 space-y-1 text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span>
                    {item.quantity}× {item.item_name}
                  </span>
                  <span className="text-muted-foreground">
                    {formatPrice(Number(item.line_total))}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {!notifEnabled && order.status !== "completed" && order.status !== "cancelled" && (
          <NotificationEnableBanner
            title="Activer les notifications"
            description="Soyez alerté (son + bannière) quand votre commande est prête."
          />
        )}

        {order.status === "ready" && (
          <p className="text-center text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            Votre commande vous attend ! 🍽️
          </p>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link href={`/menu/${slug}`}>Retour au menu</Link>
        </Button>
      </div>
    </div>
  );
}
