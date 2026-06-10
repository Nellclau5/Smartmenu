export type MenuCategory = "Entrées" | "Plats" | "Desserts" | "Boissons";

export const MENU_CATEGORIES: MenuCategory[] = [
  "Entrées",
  "Plats",
  "Desserts",
  "Boissons",
];

export type SubscriptionStatus = "trial" | "active" | "expired";

export interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  welcome_message: string | null;
  opening_hours: string | null;
  subscription_status: SubscriptionStatus;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category: MenuCategory;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  is_vegetarian: boolean;
  is_spicy: boolean;
}

export type PriceFilter = "all" | "budget" | "mid" | "premium";

export interface MenuFilters {
  search: string;
  vegetarian: boolean;
  spicy: boolean;
  price: PriceFilter;
}
