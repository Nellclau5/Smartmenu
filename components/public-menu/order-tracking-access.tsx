"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTrackedOrders } from "@/lib/order-tracking-storage";
import { cn } from "@/lib/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface OrderTrackingAccessProps {
  slug: string;
  demoMode?: boolean;
  className?: string;
}

/** Accès rapide au suivi de commande depuis le menu public */
export function OrderTrackingAccess({
  slug,
  demoMode = false,
  className,
}: OrderTrackingAccessProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<string[]>([]);

  useEffect(() => {
    setRecentOrders(getTrackedOrders(slug));
  }, [slug, open]);

  function goToTracking(orderId: string) {
    setOpen(false);
    setError(null);
    router.push(`/menu/${slug}/commande/${orderId}`);
  }

  function handleOpen() {
    if (demoMode) {
      setOpen(true);
      return;
    }

    const orders = getTrackedOrders(slug);
    if (orders.length === 1) {
      goToTracking(orders[0]);
      return;
    }

    setRecentOrders(orders);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = orderIdInput.trim();
    if (!UUID_RE.test(id)) {
      setError("Numéro de commande invalide.");
      return;
    }
    goToTracking(id);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className={cn(
          "h-9 gap-1.5 rounded-full border-primary/30 bg-background/90 px-3 text-xs font-medium shadow-sm backdrop-blur",
          className
        )}
      >
        <ClipboardList className="h-3.5 w-3.5 text-primary" />
        Suivi
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Suivi de commande</DialogTitle>
            <DialogDescription>
              {demoMode
                ? "En mode démo, passez une commande simulée pour tester le suivi."
                : "Consultez l'état de votre commande en temps réel."}
            </DialogDescription>
          </DialogHeader>

          {recentOrders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Vos commandes récentes
              </p>
              <ul className="space-y-2">
                {recentOrders.map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => goToTracking(id)}
                      className="flex w-full items-center justify-between rounded-xl border bg-muted/30 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <span className="font-medium">Table — commande</span>
                      <span className="text-xs text-muted-foreground">
                        #{id.slice(0, 8)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!demoMode && (
            <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="order-id">Numéro de commande</Label>
                <Input
                  id="order-id"
                  placeholder="Collez votre numéro de commande"
                  value={orderIdInput}
                  onChange={(e) => {
                    setOrderIdInput(e.target.value);
                    setError(null);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Vous le trouvez après avoir commandé ou dans votre lien de suivi.
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">
                Voir le suivi
              </Button>
            </form>
          )}

          {demoMode && (
            <Button variant="outline" className="w-full" asChild>
              <Link href="/register">Créer mon restaurant</Link>
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
