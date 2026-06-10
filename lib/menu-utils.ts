import type { MenuCategory, MenuFilters, MenuItem } from "@/lib/supabase/types";



/** Filtre les plats par catégorie */

export function itemsByCategory(

  items: MenuItem[],

  category: MenuCategory

): MenuItem[] {

  return items.filter((item) => item.category === category);

}



function matchesPriceFilter(price: number, filter: MenuFilters["price"]): boolean {

  if (filter === "all") return true;

  if (filter === "budget") return price < 2000;

  if (filter === "mid") return price >= 2000 && price <= 5000;

  return price > 5000;

}



/** Applique recherche texte + filtres diététiques / prix */

export function filterMenuItems(items: MenuItem[], filters: MenuFilters): MenuItem[] {

  const query = filters.search.trim().toLowerCase();



  return items.filter((item) => {

    if (filters.vegetarian && !item.is_vegetarian) return false;

    if (filters.spicy && !item.is_spicy) return false;

    if (!matchesPriceFilter(Number(item.price), filters.price)) return false;



    if (!query) return true;



    const haystack = [item.name, item.description ?? ""].join(" ").toLowerCase();

    return haystack.includes(query);

  });

}



export const DEFAULT_MENU_FILTERS: MenuFilters = {

  search: "",

  vegetarian: false,

  spicy: false,

  price: "all",

};


