import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createRestaurantForUser,
  seedSampleMenuItems,
} from "@/lib/restaurant";
import type { Restaurant } from "@/lib/supabase/types";

/** Récupère ou crée le restaurant du gérant connecté */
export async function getOrCreateRestaurant(
  supabase: SupabaseClient,
  userId: string
): Promise<{ restaurant: Restaurant | null; error: string | null }> {
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) {
    return { restaurant: data as Restaurant, error: null };
  }

  const { restaurant, error } = await createRestaurantForUser(
    supabase,
    userId,
    "Mon Restaurant"
  );

  if (restaurant) {
    await seedSampleMenuItems(supabase, restaurant.id);
  }

  return { restaurant, error };
}
