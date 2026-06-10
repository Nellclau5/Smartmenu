"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { menuItemStoragePath, uploadImage } from "@/lib/upload-image";
import { MENU_CATEGORIES, type MenuCategory, type MenuItem } from "@/lib/supabase/types";

interface MenuItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  defaultCategory?: MenuCategory;
  item?: MenuItem | null;
  onSaved: (item: MenuItem) => void;
}

/** Formulaire ajout / modification d'un plat avec photo */
export function MenuItemFormDialog({
  open,
  onOpenChange,
  restaurantId,
  defaultCategory = "Plats",
  item,
  onSaved,
}: MenuItemFormDialogProps) {
  const isEdit = !!item;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<MenuCategory>(defaultCategory);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description ?? "");
      setPrice(String(item.price));
      setCategory(item.category);
      setImageUrl(item.image_url);
      setIsVegetarian(item.is_vegetarian ?? false);
      setIsSpicy(item.is_spicy ?? false);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setCategory(defaultCategory);
      setImageUrl(null);
      setIsVegetarian(false);
      setIsSpicy(false);
    }
    setImageFile(null);
    setError(null);
  }, [item, defaultCategory, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Prix invalide");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let finalImageUrl = imageUrl;

    if (isEdit && item) {
      const itemId = item.id;

      if (imageFile) {
        const { url, error: uploadError } = await uploadImage(
          supabase,
          imageFile,
          menuItemStoragePath(restaurantId, itemId, imageFile)
        );
        if (uploadError || !url) {
          setLoading(false);
          setError(uploadError ?? "Erreur upload image");
          return;
        }
        finalImageUrl = url;
      }

      const { data, error: updateError } = await supabase
        .from("menu_items")
        .update({
          category,
          name: name.trim(),
          description: description.trim() || null,
          price: parsedPrice,
          image_url: finalImageUrl,
          is_vegetarian: isVegetarian,
          is_spicy: isSpicy,
        })
        .eq("id", itemId)
        .select()
        .single();

      setLoading(false);
      if (updateError || !data) {
        setError(updateError?.message ?? "Erreur de mise à jour");
        return;
      }
      onSaved(data as MenuItem);
    } else {
      const { data: maxData } = await supabase
        .from("menu_items")
        .select("sort_order")
        .eq("restaurant_id", restaurantId)
        .eq("category", category)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = ((maxData?.[0] as { sort_order?: number })?.sort_order ?? -1) + 1;

      const { data, error: insertError } = await supabase
        .from("menu_items")
        .insert({
          restaurant_id: restaurantId,
          category,
          name: name.trim(),
          description: description.trim() || null,
          price: parsedPrice,
          image_url: null,
          is_available: true,
          sort_order: nextOrder,
          is_vegetarian: isVegetarian,
          is_spicy: isSpicy,
        })
        .select()
        .single();

      if (insertError || !data) {
        setLoading(false);
        setError(insertError?.message ?? "Erreur lors de l'ajout");
        return;
      }

      const newItem = data as MenuItem;

      if (imageFile) {
        const { url, error: uploadError } = await uploadImage(
          supabase,
          imageFile,
          menuItemStoragePath(restaurantId, newItem.id, imageFile)
        );

        if (!uploadError && url) {
          const { data: updated } = await supabase
            .from("menu_items")
            .update({ image_url: url })
            .eq("id", newItem.id)
            .select()
            .single();

          if (updated) {
            onSaved(updated as MenuItem);
            setLoading(false);
            onOpenChange(false);
            return;
          }
        }
      }

      setLoading(false);
      onSaved(newItem);
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le plat" : "Ajouter un plat"}</DialogTitle>
          <DialogDescription>
            Photo optionnelle — idéal pour séduire vos clients
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload
            label="Photo du plat"
            currentUrl={imageUrl}
            onFileSelect={setImageFile}
            aspect="wide"
          />

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as MenuCategory)}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {MENU_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Prix (FCFA)</Label>
            <Input
              id="price"
              type="number"
              inputMode="numeric"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border px-4 py-3">
            <div>
              <Label htmlFor="vegetarian">Végétarien</Label>
              <p className="text-xs text-muted-foreground">Visible dans les filtres client</p>
            </div>
            <Switch
              id="vegetarian"
              checked={isVegetarian}
              onCheckedChange={setIsVegetarian}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border px-4 py-3">
            <div>
              <Label htmlFor="spicy">Épicé</Label>
              <p className="text-xs text-muted-foreground">Visible dans les filtres client</p>
            </div>
            <Switch id="spicy" checked={isSpicy} onCheckedChange={setIsSpicy} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? "Enregistrement..." : isEdit ? "Enregistrer" : "Ajouter au menu"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
