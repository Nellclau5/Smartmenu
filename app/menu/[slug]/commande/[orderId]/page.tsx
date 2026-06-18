import { notFound } from "next/navigation";
import { OrderTrackingView } from "@/components/public-menu/order-tracking-view";
import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/lib/supabase/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string; orderId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("name")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  const name = (data as Pick<Restaurant, "name"> | null)?.name;
  return {
    title: name ? `Commande — ${name}` : "Suivi commande",
  };
}

export default async function OrderTrackingPage({ params }: PageProps) {
  const { slug, orderId } = await params;
  const supabase = await createClient();

  const { data: restaurantData } = await supabase
    .from("restaurants")
    .select("name")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  const restaurant = restaurantData as Pick<Restaurant, "name"> | null;
  if (!restaurant) notFound();

  return (
    <OrderTrackingView
      slug={slug}
      orderId={orderId}
      restaurantName={restaurant.name}
    />
  );
}
