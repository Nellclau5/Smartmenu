"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuItemCard } from "@/components/dashboard/menu-item-card";
import { MenuItemFormDialog } from "@/components/dashboard/menu-item-form-dialog";
import { createClient } from "@/lib/supabase/client";
import { itemsByCategory as filterByCategory } from "@/lib/menu-utils";
import { useRestaurant } from "@/components/dashboard/restaurant-context";
import { MENU_CATEGORIES, type MenuCategory, type MenuItem } from "@/lib/supabase/types";

function sortItems(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => {
    const catOrder = MENU_CATEGORIES.indexOf(a.category) - MENU_CATEGORIES.indexOf(b.category);
    if (catOrder !== 0) return catOrder;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

/** Gestion du menu — cartes par catégorie, CRUD complet, toggle 1-click */
export function MenuDashboard() {
  const { id: restaurantId } = useRestaurant();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<MenuCategory>("Plats");

  const fetchItems = useCallback(async () => {
    const client = createClient();
    const { data, error } = await client
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order")
      .order("name");

    if (!error && data) {
      setItems(sortItems(data as MenuItem[]));
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function itemsByCategory(category: MenuCategory) {
    return filterByCategory(items, category);
  }

  function handleSaved(item: MenuItem) {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return sortItems(prev.map((i) => (i.id === item.id ? item : i)));
      }
      return sortItems([...prev, item]);
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
      sortItems(
        prev.map((i) => {
          if (i.id === item.id) return { ...i, sort_order: other.sort_order };
          if (i.id === other.id) return { ...i, sort_order: item.sort_order };
          return i;
        })
      )
    );
  }

  function openAdd(category: MenuCategory = "Plats") {
    setEditingItem(null);
    setDefaultCategory(category);
    setDialogOpen(true);
  }

  return (
    <div className="relative min-h-[60dvh] pb-28 md:pb-8">
      <div className="px-4 pt-6 md:px-0 md:pt-0">
        <h1 className="text-2xl font-bold tracking-tight">Gestion du menu</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Toggle rapide en plein service — modifiez prix et plats en 1 tap
        </p>
      </div>

      <main className="px-4 py-4 md:px-0 space-y-8">
        {loading ? (
          <p className="text-center text-muted-foreground py-16">Chargement...</p>
        ) : (
          MENU_CATEGORIES.map((cat) => {
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
        size="icon"
        className="fixed bottom-20 right-4 z-20 h-14 w-14 rounded-full shadow-lg md:bottom-8 md:right-8"
        onClick={() => openAdd()}
        aria-label="Ajouter un plat"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <MenuItemFormDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditingItem(null);
        }}
        restaurantId={restaurantId}
        defaultCategory={editingItem?.category ?? defaultCategory}
        item={editingItem}
        onSaved={handleSaved}
      />
    </div>
  );
}
