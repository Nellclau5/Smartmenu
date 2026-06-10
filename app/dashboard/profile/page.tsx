"use client";

import { ProfileForm } from "@/components/dashboard/profile-form";
import { useRestaurant } from "@/components/dashboard/restaurant-context";

export default function DashboardProfilePage() {
  const restaurant = useRestaurant();
  return <ProfileForm restaurant={restaurant} />;
}
