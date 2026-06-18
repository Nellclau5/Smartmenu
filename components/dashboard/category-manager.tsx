"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { normalizeCategoryName } from "@/lib/categories";
import type { MenuItem } from "@/lib/supabase/types";

interface CategoryManagerProps {
  restaurantId: string;
  categories: string[];
  items: MenuItem[];
  onCategoriesChange: (categories: string[]) => void;
}

/** Gestion des catégories personnalisées du menu */
export function CategoryManager({
  restaurantId,
  categories,
  items,
  onCategoriesChange,
}: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveCategories(next: string[]) {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("restaurants")
      .update({ menu_categories: next })
      .eq("id", restaurantId);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onCategoriesChange(next);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = normalizeCategoryName(newCategory);
    if (!name) return;
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setError("Cette catégorie existe déjà");
      return;
    }
    await saveCategories([...categories, name]);
    setNewCategory("");
  }

  async function handleRemove(category: string) {
    const count = items.filter((i) => i.category === category).length;
    if (count > 0) {
      setError(`Impossible : ${count} plat(s) dans « ${category} »`);
      return;
    }
    await saveCategories(categories.filter((c) => c !== category));
  }

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div>
          <h2 className="font-semibold">Vos catégories</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Personnalisez les sections de votre menu (ex : Pizzas, Cocktails…)
          </p>
        </div>

        <ul className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            return (
              <li
                key={cat}
                className="flex items-center gap-1 rounded-full border bg-muted/40 pl-3 pr-1 py-1 text-sm"
              >
                <span className="font-medium">{cat}</span>
                <span className="text-xs text-muted-foreground">({count})</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(cat)}
                  disabled={saving || categories.length <= 1}
                  aria-label={`Supprimer ${cat}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>

        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder="Nouvelle catégorie"
            value={newCategory}
            onChange={(e) => {
              setNewCategory(e.target.value);
              setError(null);
            }}
            disabled={saving}
          />
          <Button type="submit" variant="outline" className="shrink-0 gap-1" disabled={saving}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
