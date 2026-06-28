"use client";

import Link from "next/link";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getEffectiveSubscriptionStatus,
  getTrialDaysRemaining,
  TRIAL_DAYS,
} from "@/lib/subscription";
import type { Restaurant } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface SubscriptionBannerProps {
  restaurant: Restaurant;
  className?: string;
}

export function SubscriptionBanner({ restaurant, className }: SubscriptionBannerProps) {
  const status = getEffectiveSubscriptionStatus(restaurant);
  const daysLeft = getTrialDaysRemaining(restaurant.subscription_expires_at);

  if (status === "active") return null;

  if (status === "expired") {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">Essai terminé</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Vos {TRIAL_DAYS} jours gratuits sont écoulés. Abonnez-vous pour
              réactiver votre menu public et les commandes.
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0 rounded-xl">
          <Link href="/dashboard/subscription">S&apos;abonner</Link>
        </Button>
      </div>
    );
  }

  const urgent = daysLeft !== null && daysLeft <= 3;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        urgent
          ? "border-amber-300/60 bg-amber-50 dark:bg-amber-950/20"
          : "border-primary/20 bg-primary/5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {urgent ? (
          <Clock className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        ) : (
          <Sparkles className="h-5 w-5 shrink-0 text-primary mt-0.5" />
        )}
        <div>
          <p className={cn("font-semibold", urgent ? "text-amber-800 dark:text-amber-200" : "text-primary")}>
            Essai gratuit — {daysLeft ?? TRIAL_DAYS} jour{(daysLeft ?? TRIAL_DAYS) > 1 ? "s" : ""} restant{(daysLeft ?? TRIAL_DAYS) > 1 ? "s" : ""}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Profitez de toutes les fonctionnalités. Puis abonnez-vous pour continuer.
          </p>
        </div>
      </div>
      <Button variant={urgent ? "default" : "outline"} asChild className="shrink-0 rounded-xl">
        <Link href="/dashboard/subscription">Voir les offres</Link>
      </Button>
    </div>
  );
}
