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

export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  preparing: "En préparation",
  ready: "Prête",
  completed: "Terminée",
  cancelled: "Annulée",
};

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_number: string;
  customer_name: string | null;
  notes: string | null;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  order_items?: OrderItem[];
}

export interface CartLineInput {
  menu_item_id: string;
  quantity: number;
}
