"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/components/public-menu/cart-context";
import { formatPrice } from "@/lib/utils";
import {
  getNotificationPermission,
  notifyUser,
  requestNotificationPermission,
} from "@/lib/notifications";
import type { Restaurant } from "@/lib/supabase/types";

interface OrderCartProps {
  restaurant: Restaurant;
  demoMode?: boolean;
}

/** Panier flottant + validation de commande */
export function OrderCart({ restaurant, demoMode = false }: OrderCartProps) {
  const router = useRouter();
  const { lines, itemCount, total, setQuantity, removeItem, clearCart } = useCart();
  const [open, setOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (getNotificationPermission() === "default") {
      await requestNotificationPermission();
    }

    setSubmitting(true);

    try {
      if (demoMode) {
        clearCart();
        setTableNumber("");
        setCustomerName("");
        setNotes("");
        setOrderId("demo");
        setSuccess(true);
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          table_number: tableNumber,
          customer_name: customerName,
          notes,
          items: lines.map((l) => ({
            menu_item_id: l.item.id,
            quantity: l.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'envoi");
        return;
      }

      const newOrderId = data.order_id as string;

      void notifyUser(
        {
          title: "Commande envoyée",
          body: "Suivez son avancement en temps réel.",
          url: `/menu/${restaurant.slug}/commande/${newOrderId}`,
        },
        { sound: true, inApp: true }
      );

      clearCart();
      setTableNumber("");
      setCustomerName("");
      setNotes("");
      setOrderId(newOrderId);
      setSuccess(true);
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setSuccess(false);
      setOrderId(null);
    }
  }

  if (itemCount === 0 && !open) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-40 safe-bottom md:left-auto md:right-6 md:max-w-sm">
        <Button
          type="button"
          className="h-14 w-full rounded-2xl shadow-2xl ring-4 ring-primary/20 text-base font-semibold gap-3"
          onClick={() => setOpen(true)}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="flex-1 text-left">
            Voir le panier · {itemCount} article{itemCount > 1 ? "s" : ""}
          </span>
          <span className="font-bold">{formatPrice(total)}</span>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          {success ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {demoMode ? "Commande simulée ✓" : "Commande envoyée ✓"}
                </DialogTitle>
                <DialogDescription>
                  {demoMode
                    ? "En mode démo, la commande n'est pas envoyée au restaurant. Créez votre compte pour recevoir de vraies commandes."
                    : "Suivez l'avancement de votre commande en temps réel."}
                </DialogDescription>
              </DialogHeader>
              {demoMode ? (
                <Button className="w-full h-12" asChild>
                  <Link href="/register">Créer mon menu gratuitement</Link>
                </Button>
              ) : (
                <Button
                  className="w-full h-12"
                  onClick={() => {
                    if (orderId) {
                      router.push(`/menu/${restaurant.slug}/commande/${orderId}`);
                    }
                    handleOpenChange(false);
                  }}
                >
                  Suivre ma commande
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleOpenChange(false)}
              >
                Continuer le menu
              </Button>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Votre commande</DialogTitle>
                <DialogDescription>
                  Vérifiez votre panier puis indiquez votre table.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 max-h-48 overflow-y-auto">
                {lines.map((line) => (
                  <div
                    key={line.item.id}
                    className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{line.item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(Number(line.item.price))}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setQuantity(line.item.id, line.quantity - 1)}
                        aria-label="Diminuer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">
                        {line.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setQuantity(line.item.id, line.quantity + 1)}
                        aria-label="Augmenter"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeItem(line.item.id)}
                        aria-label="Retirer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-right font-bold text-primary">{formatPrice(total)}</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="table">Numéro de table *</Label>
                  <Input
                    id="table"
                    placeholder="Ex : 12"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Votre prénom (optionnel)</Label>
                  <Input
                    id="name"
                    placeholder="Pour vous identifier"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Note (optionnel)</Label>
                  <textarea
                    id="notes"
                    rows={2}
                    placeholder="Allergie, cuisson, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>

                {error && <p className="text-sm text-destructive text-center">{error}</p>}

                <Button type="submit" className="w-full h-12" disabled={submitting || lines.length === 0}>
                  {submitting ? "Envoi en cours..." : "Commander"}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
