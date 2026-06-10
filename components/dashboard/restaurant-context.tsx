"use client";

import { createContext, useContext } from "react";
import type { Restaurant } from "@/lib/supabase/types";

const RestaurantContext = createContext<Restaurant | null>(null);

export function RestaurantProvider({
  restaurant,
  children,
}: {
  restaurant: Restaurant;
  children: React.ReactNode;
}) {
  return (
    <RestaurantContext.Provider value={restaurant}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant(): Restaurant {
  const ctx = useContext(RestaurantContext);
  if (!ctx) {
    throw new Error("useRestaurant doit être utilisé dans le dashboard");
  }
  return ctx;
}
