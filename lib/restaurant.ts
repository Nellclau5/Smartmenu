import type { SupabaseClient } from "@supabase/supabase-js";
import type { MenuCategory, Restaurant } from "@/lib/supabase/types";

/** Génère un slug URL-safe unique à partir du nom */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "mon-restaurant";
}

/** Plats de démonstration insérés à la création du restaurant */
const SAMPLE_ITEMS: {
  category: MenuCategory;
  name: string;
  description: string;
  price: number;
  sort_order: number;
}[] = [
  {
    category: "Entrées",
    name: "Salade verte",
    description: "Laitue, tomates, vinaigrette maison",
    price: 2000,
    sort_order: 0,
  },
  {
    category: "Plats",
    name: "Poulet Yassa",
    description: "Mariné aux oignons et citron, servi avec du riz",
    price: 3500,
    sort_order: 0,
  },
  {
    category: "Boissons",
    name: "Bissap",
    description: "Jus d'hibiscus frais",
    price: 1000,
    sort_order: 0,
  },
];

/** Crée un restaurant pour un utilisateur avec slug unique */
export async function createRestaurantForUser(
  supabase: SupabaseClient,
  userId: string,
  restaurantName: string
): Promise<{ restaurant: Restaurant | null; error: string | null }> {
  const baseSlug = slugify(restaurantName);
  let slug = baseSlug;
  let attempt = 0;

  while (attempt < 5) {
    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        user_id: userId,
        name: restaurantName.trim(),
        slug,
        is_active: true,
        subscription_status: "trial",
      })
      .select()
      .single();

    if (!error && data) {
      return { restaurant: data as Restaurant, error: null };
    }

    if (error?.code === "23505") {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
      continue;
    }

    return { restaurant: null, error: error?.message ?? "Erreur création restaurant" };
  }

  return { restaurant: null, error: "Impossible de générer un slug unique" };
}

/** Insère les plats de démo dans le menu du restaurant */
export async function seedSampleMenuItems(
  supabase: SupabaseClient,
  restaurantId: string
): Promise<void> {
  const { count } = await supabase
    .from("menu_items")
    .select("*", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId);

  if (count && count > 0) return;

  await supabase.from("menu_items").insert(
    SAMPLE_ITEMS.map((item) => ({
      restaurant_id: restaurantId,
      ...item,
      is_available: true,
    }))
  );
}

/** URL publique du menu */
export function getMenuPublicUrl(slug: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/menu/${slug}`;
  }
  return `/menu/${slug}`;
}
