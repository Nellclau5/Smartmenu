import type { SupabaseClient } from "@supabase/supabase-js";
import type { Restaurant } from "@/lib/supabase/types";

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

/** URL publique du menu */
export function getMenuPublicUrl(slug: string, options?: { src?: string }): string {
  const path = `/menu/${slug}`;
  const query = options?.src ? `?src=${encodeURIComponent(options.src)}` : "";

  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}${query}`;
  }
  return `${path}${query}`;
}
