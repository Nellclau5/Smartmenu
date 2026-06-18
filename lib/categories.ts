import type { MenuItem, Restaurant } from "@/lib/supabase/types";

export const DEFAULT_MENU_CATEGORIES = ["Entrées", "Plats", "Desserts", "Boissons"];

/** Catégories du restaurant ou valeurs par défaut */
export function getRestaurantCategories(
  restaurant: Pick<Restaurant, "menu_categories">
): string[] {
  const cats = restaurant.menu_categories;
  if (Array.isArray(cats) && cats.length > 0) {
    return cats.filter((c) => typeof c === "string" && c.trim()).map((c) => c.trim());
  }
  return [...DEFAULT_MENU_CATEGORIES];
}

/** Catégories présentes dans les plats + ordre du restaurant */
export function getOrderedCategories(categories: string[], items: MenuItem[]): string[] {
  const fromItems = new Set(items.map((i) => i.category));
  const ordered = categories.filter((c) => fromItems.has(c));
  fromItems.forEach((c) => {
    if (!ordered.includes(c)) ordered.push(c);
  });
  return ordered;
}

export function sortItemsByCategories(items: MenuItem[], categories: string[]): MenuItem[] {
  return [...items].sort((a, b) => {
    const catOrder =
      categories.indexOf(a.category) - categories.indexOf(b.category);
    if (catOrder !== 0) return catOrder;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

export function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}
