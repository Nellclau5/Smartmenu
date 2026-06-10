import { notFound } from "next/navigation";
import { PublicMenuView } from "@/components/public-menu/public-menu-view";
import { createClient } from "@/lib/supabase/server";
import type { MenuItem, Restaurant } from "@/lib/supabase/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Génère les métadonnées SEO pour le menu public */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: metaRestaurant } = await supabase
    .from("restaurants")
    .select("name")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  const restaurantName = (metaRestaurant as Pick<Restaurant, "name"> | null)?.name;

  return {
    title: restaurantName ? `${restaurantName} — Menu` : "Menu",
    description: restaurantName
      ? `Découvrez le menu de ${restaurantName}`
      : "Menu restaurant",
  };
}

/**
 * Menu public — /menu/[slug]
 * Page épurée sans navigation globale, optimisée mobile.
 */
export default async function PublicMenuPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: restaurantData } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  const restaurant = restaurantData as Restaurant | null;

  if (!restaurant) {
    notFound();
  }

  const { data: itemsData } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order")
    .order("name");

  const items = (itemsData ?? []) as MenuItem[];

  return <PublicMenuView restaurant={restaurant} items={items} />;
}
