export type MenuCategory = string;

/** @deprecated Utiliser DEFAULT_MENU_CATEGORIES depuis lib/categories */
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
  menu_categories: string[] | null;
  auto_delete_orders_after_24h?: boolean;
  subscription_status: SubscriptionStatus;
  subscription_expires_at?: string | null;
  is_active: boolean;
}

export type SubscriptionPaymentStatus = "pending" | "completed" | "failed" | "expired";

export interface SubscriptionPayment {
  id: string;
  restaurant_id: string;
  user_id: string;
  geniuspay_reference: string;
  amount: number;
  currency: string;
  status: SubscriptionPaymentStatus;
  plan: string;
  created_at: string;
  completed_at: string | null;
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
