"use client";

import { Suspense } from "react";
import { SubscriptionPanel } from "@/components/dashboard/subscription-panel";
import { useRestaurant } from "@/components/dashboard/restaurant-context";

function SubscriptionContent() {
  const restaurant = useRestaurant();
  return <SubscriptionPanel restaurant={restaurant} />;
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 pt-6 text-muted-foreground">Chargement…</div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
