"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QrCode, UtensilsCrossed, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCodeModal } from "@/components/dashboard/qr-code-modal";
import { createClient } from "@/lib/supabase/client";
import {
  formatExpiryDate,
  getEffectiveSubscriptionStatus,
} from "@/lib/subscription";
import type { Restaurant } from "@/lib/supabase/types";

const SUBSCRIPTION_LABELS = {
  trial: { label: "Essai gratuit", color: "text-amber-600 bg-amber-50" },
  active: { label: "Abonnement actif", color: "text-primary bg-primary/10" },
  expired: { label: "Expiré", color: "text-destructive bg-destructive/10" },
};

interface DashboardHomeProps {
  restaurant: Restaurant;
}

export function DashboardHome({ restaurant }: DashboardHomeProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, online: 0 });

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("menu_items")
      .select("is_available")
      .eq("restaurant_id", restaurant.id)
      .then(({ data }) => {
        if (data) {
          setStats({
            total: data.length,
            online: data.filter((i) => i.is_available).length,
          });
        }
      });
  }, [restaurant.id]);

  const effectiveStatus = getEffectiveSubscriptionStatus(restaurant);
  const sub = SUBSCRIPTION_LABELS[effectiveStatus] ?? SUBSCRIPTION_LABELS.trial;
  const expiryLabel = formatExpiryDate(restaurant.subscription_expires_at);

  return (
    <div className="space-y-6 px-4 pt-6 md:px-0 md:pt-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bonjour 👋
        </h1>
        <p className="text-muted-foreground mt-1">{restaurant.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.online}</p>
              <p className="text-xs text-muted-foreground">Plats en ligne</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${sub.color}`}>
                {sub.label}
              </span>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {expiryLabel && effectiveStatus === "active"
                  ? `Jusqu'au ${expiryLabel}`
                  : `${stats.total} plats au total`}
              </p>
            </div>
            {(effectiveStatus === "trial" || effectiveStatus === "expired") && (
              <Button variant="outline" size="sm" className="shrink-0 rounded-xl" asChild>
                <Link href="/dashboard/subscription">S&apos;abonner</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code CTA */}
      <Button
        size="lg"
        className="w-full h-14 text-base gap-3 rounded-2xl shadow-md"
        onClick={() => setQrOpen(true)}
      >
        <QrCode className="h-6 w-6" />
        Voir / Télécharger mon QR Code
      </Button>

      <QrCodeModal
        open={qrOpen}
        onOpenChange={setQrOpen}
        slug={restaurant.slug}
        restaurantName={restaurant.name}
      />
    </div>
  );
}
