"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  SUBSCRIPTION_PLAN,
  formatExpiryDate,
  formatPriceXof,
  getEffectiveSubscriptionStatus,
  getSubscriptionPriceXof,
} from "@/lib/subscription";
import type { Restaurant } from "@/lib/supabase/types";

const STATUS_UI = {
  trial: {
    label: "Essai gratuit",
    description: "Profitez de Smart Menu. Passez à l'abonnement pour continuer sans interruption.",
    color: "text-amber-600 bg-amber-50",
  },
  active: {
    label: "Abonnement actif",
    description: "Votre menu digital est actif. Merci pour votre confiance !",
    color: "text-primary bg-primary/10",
  },
  expired: {
    label: "Abonnement expiré",
    description: "Renouvelez votre abonnement pour garder votre menu en ligne.",
    color: "text-destructive bg-destructive/10",
  },
};

const PAYMENT_REF_KEY = "smartmenu_subscription_ref";

interface SubscriptionPanelProps {
  restaurant: Restaurant;
}

export function SubscriptionPanel({ restaurant: initialRestaurant }: SubscriptionPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnStatus = searchParams.get("status");
  const price = getSubscriptionPriceXof();
  const effectiveStatus = getEffectiveSubscriptionStatus(restaurant);
  const statusUi = STATUS_UI[effectiveStatus];
  const expiryLabel = formatExpiryDate(restaurant.subscription_expires_at);

  const refreshRestaurant = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurant.id)
      .single();

    if (data) {
      setRestaurant(data as Restaurant);
    }
  }, [restaurant.id]);

  const confirmPayment = useCallback(
    async (reference: string) => {
      setConfirming(true);
      setError(null);

      try {
        const res = await fetch("/api/subscription/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Confirmation impossible");
          return;
        }

        if (data.status === "completed") {
          sessionStorage.removeItem(PAYMENT_REF_KEY);
          await refreshRestaurant();
          router.replace("/dashboard/subscription");
        }
      } catch {
        setError("Erreur réseau lors de la confirmation");
      } finally {
        setConfirming(false);
      }
    },
    [refreshRestaurant, router]
  );

  useEffect(() => {
    if (returnStatus !== "success") return;

    const reference = sessionStorage.getItem(PAYMENT_REF_KEY);
    if (reference) {
      void confirmPayment(reference);
    }
  }, [returnStatus, confirmPayment]);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subscription/checkout", { method: "POST" });
      const data = await res.json();

        if (!res.ok) {
          setError(
            data.detail
              ? `${data.error} (${data.detail})`
              : (data.error ?? "Impossible de démarrer le paiement")
          );
          return;
        }

      if (data.reference) {
        sessionStorage.setItem(PAYMENT_REF_KEY, data.reference);
      }

      window.location.href = data.checkout_url;
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 px-4 pt-6 md:px-0 md:pt-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abonnement</h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre abonnement Smart Menu via Genius Pay
        </p>
      </div>

      {returnStatus === "success" && (confirming || effectiveStatus === "active") && (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          {confirming ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          )}
          <div>
            <p className="font-medium text-primary">
              {confirming ? "Confirmation du paiement…" : "Paiement confirmé !"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {confirming
                ? "Nous activons votre abonnement, patientez quelques secondes."
                : "Votre abonnement est maintenant actif."}
            </p>
          </div>
        </div>
      )}

      {returnStatus === "error" && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <XCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Paiement non abouti</p>
            <p className="text-sm text-muted-foreground mt-1">
              Le paiement a été annulé ou a échoué. Vous pouvez réessayer.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Statut actuel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${statusUi.color}`}
            >
              {statusUi.label}
            </span>
            <p className="text-sm text-muted-foreground mt-2">{statusUi.description}</p>
            {expiryLabel && effectiveStatus === "active" && (
              <p className="text-sm font-medium mt-2">
                Valide jusqu&apos;au {expiryLabel}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{SUBSCRIPTION_PLAN.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-3xl font-bold">{formatPriceXof(price)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Paiement sécurisé via Genius Pay (Wave, Orange Money, MTN, carte…)
            </p>
          </div>

          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>• Menu digital illimité</li>
            <li>• QR code et commandes en ligne</li>
            <li>• Notifications et suivi des commandes</li>
          </ul>

          {(effectiveStatus === "trial" || effectiveStatus === "expired") && (
            <Button
              size="lg"
              className="w-full h-12 rounded-2xl"
              onClick={handleSubscribe}
              disabled={loading || confirming}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Redirection…
                </>
              ) : (
                "S'abonner avec Genius Pay"
              )}
            </Button>
          )}

          {effectiveStatus === "active" && (
            <Button
              size="lg"
              variant={expiryLabel ? "outline" : "default"}
              className="w-full h-12 rounded-2xl"
              onClick={handleSubscribe}
              disabled={loading || confirming}
            >
              {loading ? "Redirection…" : "Renouveler mon abonnement"}
            </Button>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        Besoin d&apos;aide ?{" "}
        <Link href="/dashboard" className="text-primary underline-offset-2 hover:underline">
          Retour au tableau de bord
        </Link>
      </p>
    </div>
  );
}
