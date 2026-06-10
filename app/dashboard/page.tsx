"use client";

import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { useRestaurant } from "@/components/dashboard/restaurant-context";

export default function DashboardPage() {
  const restaurant = useRestaurant();
  return <DashboardHome restaurant={restaurant} />;
}
