"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardList, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { useRestaurant } from "@/components/dashboard/restaurant-context";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "@/lib/supabase/types";

const POLL_MS = 5000;

const STATUS_FLOW: OrderStatus[] = ["pending", "preparing", "ready", "completed"];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  preparing: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Liste des commandes clients pour le restaurateur */
export function OrdersDashboard() {
  const restaurant = useRestaurant();
  const restaurantId = restaurant.id;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoDelete, setAutoDelete] = useState(
    restaurant.auto_delete_orders_after_24h ?? false
  );
  const [savingSetting, setSavingSetting] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    const supabase = createClient();

    if (autoDelete) {
      await supabase.rpc("purge_old_orders", {
        p_restaurant_id: restaurantId,
      });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      const next = data as Order[];
      next.forEach((o) => seenIdsRef.current.add(o.id));
      setOrders(next);
    }
    setLoading(false);
  }, [restaurantId, autoDelete]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function updateAutoDelete(enabled: boolean) {
    setSavingSetting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("restaurants")
      .update({ auto_delete_orders_after_24h: enabled })
      .eq("id", restaurantId);

    setSavingSetting(false);

    if (!error) {
      setAutoDelete(enabled);
      if (enabled) {
        await fetchOrders();
      }
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    const supabase = createClient();
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    }
  }

  function nextStatus(current: OrderStatus): OrderStatus | null {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  }

  const activeOrders = orders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled"
  );

  const isNewOrder = (order: Order) =>
    order.status === "pending" &&
    Date.now() - new Date(order.created_at).getTime() < 120_000;

  return (
    <div className="space-y-6 px-4 pt-6 md:px-0 md:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commandes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Commandes reçues depuis le menu QR
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchOrders} aria-label="Actualiser">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5 shadow-none">
        <CardContent className="flex items-start gap-4 p-4">
          <Trash2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-1">
            <Label htmlFor="auto-delete" className="font-medium text-sm cursor-pointer">
              Suppression automatique après 24 h
            </Label>
            <p className="text-xs text-muted-foreground">
              Les commandes terminées ou annulées sont effacées automatiquement
              24 heures après leur création.
            </p>
          </div>
          <Switch
            id="auto-delete"
            checked={autoDelete}
            onCheckedChange={updateAutoDelete}
            disabled={savingSetting}
          />
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center text-muted-foreground py-16">Chargement...</p>
      ) : orders.length === 0 ? (
        <Card className="border-dashed border-2 shadow-none">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">Aucune commande pour le moment</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les clients peuvent commander depuis votre menu public.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeOrders.length > 0 && (
            <p className="text-sm font-medium text-primary">
              {activeOrders.length} commande{activeOrders.length > 1 ? "s" : ""} en cours
            </p>
          )}
          {orders.map((order) => {
            const items = (order.order_items ?? []) as OrderItem[];
            const next = nextStatus(order.status);

            return (
              <Card
                key={order.id}
                className={cn(
                  "shadow-sm overflow-hidden transition-shadow",
                  isNewOrder(order) && "ring-2 ring-primary shadow-md"
                )}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-lg">Table {order.table_number}</span>
                        <Badge className={cn("text-xs", STATUS_COLORS[order.status])}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTime(order.created_at)}
                        {order.customer_name && ` · ${order.customer_name}`}
                      </p>
                    </div>
                    <p className="font-bold text-primary shrink-0">
                      {formatPrice(Number(order.total_amount))}
                    </p>
                  </div>

                  <ul className="space-y-1 text-sm">
                    {items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-2">
                        <span>
                          {item.quantity}× {item.item_name}
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          {formatPrice(Number(item.line_total))}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {order.notes && (
                    <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                      {order.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {next && (
                      <Button
                        size="sm"
                        className="rounded-xl"
                        onClick={() => updateStatus(order.id, next)}
                      >
                        → {ORDER_STATUS_LABELS[next]}
                      </Button>
                    )}
                    {order.status !== "cancelled" && order.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-destructive"
                        onClick={() => updateStatus(order.id, "cancelled")}
                      >
                        Annuler
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
