"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLoadingScreen } from "@/components/brand/app-loading-screen";
import { MenuItemCard } from "@/components/dashboard/menu-item-card";
import { MenuItemFormDialog } from "@/components/dashboard/menu-item-form-dialog";
import { CategoryManager } from "@/components/dashboard/category-manager";
import { createClient } from "@/lib/supabase/client";
import { itemsByCategory as filterByCategory } from "@/lib/menu-utils";
import { useRestaurant } from "@/components/dashboard/restaurant-context";
import {
  getRestaurantCategories,
  sortItemsByCategories,
} from "@/lib/categories";
import type { MenuCategory, MenuItem } from "@/lib/supabase/types";

/** Gestion du menu — catégories personnalisées, CRUD, toggle 1-click */
export function MenuDashboard() {
  const restaurant = useRestaurant();
  const { id: restaurantId } = restaurant;
  const [categories, setCategories] = useState<string[]>(() =>
    getRestaurantCategories(restaurant)
  );
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<MenuCategory>(
    () => getRestaurantCategories(restaurant)[0] ?? "Plats"
  );

  const fetchItems = useCallback(async () => {
    const client = createClient();
    const { data, error } = await client
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order")
      .order("name");

    if (!error && data) {
      setItems(sortItemsByCategories(data as MenuItem[], categories));
    }
    setLoading(false);
  }, [restaurantId, categories]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function itemsByCategory(category: MenuCategory) {
    return filterByCategory(items, category);
  }

  function handleSaved(item: MenuItem) {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      const next = exists
        ? prev.map((i) => (i.id === item.id ? item : i))
        : [...prev, item];
      return sortItemsByCategories(next, categories);
    });
    setEditingItem(null);
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleMove(id: string, direction: "up" | "down") {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const catItems = itemsByCategory(item.category);
    const idx = catItems.findIndex((i) => i.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= catItems.length) return;

    const other = catItems[swapIdx];
    const supabase = createClient();

    await Promise.all([
      supabase.from("menu_items").update({ sort_order: other.sort_order }).eq("id", item.id),
      supabase.from("menu_items").update({ sort_order: item.sort_order }).eq("id", other.id),
    ]);

    setItems((prev) =>
      sortItemsByCategories(
        prev.map((i) => {
          if (i.id === item.id) return { ...i, sort_order: other.sort_order };
          if (i.id === other.id) return { ...i, sort_order: item.sort_order };
          return i;
        }),
        categories
      )
    );
  }

  function openAdd(category: MenuCategory = defaultCategory) {
    setEditingItem(null);
    setDefaultCategory(category);
    setDialogOpen(true);
  }

  return (
    <div className="relative min-h-[60dvh] pb-32 md:pb-8">
      <div className="px-4 pt-6 md:px-0 md:pt-0">
        <h1 className="text-2xl font-bold tracking-tight">Gestion du menu</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Toggle rapide en plein service — modifiez prix et plats en 1 tap
        </p>
      </div>

      <main className="px-4 py-4 md:px-0 space-y-8">
        <CategoryManager
          restaurantId={restaurantId}
          categories={categories}
          items={items}
          onCategoriesChange={setCategories}
        />

        {loading ? (
          <AppLoadingScreen compact label="Chargement du menu…" />
        ) : (
          categories.map((cat) => {
            const catItems = itemsByCategory(cat);
            return (
              <section key={cat}>
                <h2 className="text-lg font-semibold mb-3 flex items-center justify-between">
                  {cat}
                  <span className="text-sm font-normal text-muted-foreground">
                    {catItems.length} plat{catItems.length !== 1 ? "s" : ""}
                  </span>
                </h2>

                {catItems.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => openAdd(cat)}
                    className="w-full rounded-2xl border-2 border-dashed border-muted py-8 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    + Ajouter dans {cat}
                  </button>
                ) : (
                  <div className="space-y-3">
                    {catItems.map((item, idx) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        isFirst={idx === 0}
                        isLast={idx === catItems.length - 1}
                        onEdit={(i) => {
                          setEditingItem(i);
                          setDialogOpen(true);
                        }}
                        onDelete={handleDelete}
                        onToggle={() => {}}
                        onMove={handleMove}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })
        )}
      </main>

      <Button
        type="button"
        className="fixed bottom-24 right-4 z-40 h-14 gap-2 rounded-full px-5 shadow-2xl ring-4 ring-primary/25 bg-primary hover:bg-primary/90 md:bottom-8 md:right-8 md:h-16 md:px-6"
        onClick={() => openAdd()}
        aria-label="Ajouter un plat"
      >
        <Plus className="h-6 w-6 md:h-7 md:w-7" />
        <span className="font-semibold text-sm md:text-base">Ajouter</span>
      </Button>

      <MenuItemFormDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditingItem(null);
        }}
        restaurantId={restaurantId}
        categories={categories}
        defaultCategory={editingItem?.category ?? defaultCategory}
        item={editingItem}
        onSaved={handleSaved}
      />
    </div>
  );
}
