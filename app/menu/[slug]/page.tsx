import { notFound } from "next/navigation";
import { PublicMenuView } from "@/components/public-menu/public-menu-view";
import { createClient } from "@/lib/supabase/server";
import { isRestaurantMenuPublic } from "@/lib/subscription";
import type { MenuItem, Restaurant } from "@/lib/supabase/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string }>;
}

/** Génère les métadonnées SEO pour le menu public */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: metaRestaurant } = await supabase
    .from("restaurants")
    .select("name, is_active, subscription_status, subscription_expires_at")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  const meta = metaRestaurant as Restaurant | null;
  if (!meta || !isRestaurantMenuPublic(meta)) {
    return {
      title: "Menu",
      description: "Menu restaurant",
    };
  }

  return {
    title: `${meta.name} — Menu`,
    description: `Découvrez le menu de ${meta.name}`,
  };
}

/**
 * Menu public — /menu/[slug]
 * Page épurée sans navigation globale, optimisée mobile.
 */
export default async function PublicMenuPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { src } = await searchParams;
  const scanSource = src === "qr" ? "qr" : src?.slice(0, 32);
  const supabase = await createClient();

  const { data: restaurantData } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  const restaurant = restaurantData as Restaurant | null;

  if (!restaurant || !isRestaurantMenuPublic(restaurant)) {
    notFound();
  }

  const { data: itemsData } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order")
    .order("name");

  const items = (itemsData ?? []) as MenuItem[];

  return (
    <PublicMenuView
      restaurant={restaurant}
      items={items}
      scanSource={scanSource}
    />
  );
}
