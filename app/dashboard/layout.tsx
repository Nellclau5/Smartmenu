import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OrderNotifications } from "@/components/dashboard/order-notifications";
import { RestaurantProvider } from "@/components/dashboard/restaurant-context";
import { getOrCreateRestaurant } from "@/lib/get-restaurant";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { restaurant, error } = await getOrCreateRestaurant(supabase, user.id);

  if (!restaurant) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 text-center">
        <p className="text-muted-foreground">{error ?? "Erreur de chargement"}</p>
      </div>
    );
  }

  return (
    <RestaurantProvider restaurant={restaurant}>
      <OrderNotifications />
      <DashboardShell restaurant={restaurant}>{children}</DashboardShell>
    </RestaurantProvider>
  );
}
