"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MenuItemThumbnail } from "@/components/ui/menu-item-thumbnail";
import { useCart } from "@/components/public-menu/cart-context";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { trackDishView } from "@/lib/menu-analytics";
import type { MenuItem } from "@/lib/supabase/types";

interface MenuItemCardProps {
  item: MenuItem;
  showCategory?: boolean;
  restaurantId?: string;
  trackViews?: boolean;
}

/** Carte plat compacte — détail au clic, image grande uniquement dans la modale */
export function MenuItemCard({
  item,
  showCategory = false,
  restaurantId,
  trackViews = false,
}: MenuItemCardProps) {
  const { addItem } = useCart();
  const [detailOpen, setDetailOpen] = useState(false);
  const unavailable = !item.is_available;

  function openDetail() {
    setDetailOpen(true);
    if (trackViews && restaurantId) {
      trackDishView(restaurantId, item.id);
    }
  }

  function handleAdd(e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!unavailable) addItem(item);
  }

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={openDetail}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetail();
          }
        }}
        className={cn(
          "cursor-pointer overflow-hidden border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md",
          unavailable && "opacity-55 grayscale-[0.6]"
        )}
      >
        <CardContent className="flex items-start justify-between gap-3 p-4">
          <div className="flex min-w-0 flex-1 gap-3">
            <MenuItemThumbnail
              imageUrl={item.image_url}
              name={item.name}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-base font-bold leading-snug text-foreground">
                  {item.name}
                </h3>
                {showCategory && (
                  <Badge variant="secondary" className="text-[10px]">
                    {item.category}
                  </Badge>
                )}
                {item.is_vegetarian && (
                  <Badge variant="secondary" className="text-[10px]">
                    Végétarien
                  </Badge>
                )}
                {item.is_spicy && (
                  <Badge variant="secondary" className="text-[10px]">
                    Épicé
                  </Badge>
                )}
                {unavailable && (
                  <Badge variant="destructive" className="text-[10px] font-medium">
                    Indisponible
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <p className="whitespace-nowrap font-display text-base font-bold text-primary">
              {formatPrice(Number(item.price))}
            </p>
            {!unavailable && (
              <Button
                type="button"
                size="sm"
                className="h-9 rounded-xl gap-1.5 px-3"
                onClick={handleAdd}
                aria-label={`Ajouter ${item.name} au panier`}
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto p-0 gap-0">
          {item.image_url && (
            <MenuItemThumbnail
              imageUrl={item.image_url}
              name={item.name}
              size="lg"
              className="aspect-[16/9] w-full max-h-56 rounded-none rounded-t-2xl"
            />
          )}
          <div className="space-y-4 p-6">
            <DialogHeader className="text-left space-y-2">
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <DialogTitle className="text-xl">{item.name}</DialogTitle>
                {showCategory && (
                  <Badge variant="secondary">{item.category}</Badge>
                )}
              </div>
              <p className="text-lg font-bold text-primary">
                {formatPrice(Number(item.price))}
              </p>
            </DialogHeader>

            {item.description ? (
              <DialogDescription className="text-left text-sm leading-relaxed text-foreground/80">
                {item.description}
              </DialogDescription>
            ) : (
              <DialogDescription className="text-left">
                Aucune description pour ce plat.
              </DialogDescription>
            )}

            {(item.is_vegetarian || item.is_spicy) && (
              <div className="flex flex-wrap gap-2">
                {item.is_vegetarian && <Badge variant="secondary">Végétarien</Badge>}
                {item.is_spicy && <Badge variant="secondary">Épicé</Badge>}
              </div>
            )}

            {!unavailable ? (
              <Button className="w-full h-12 rounded-xl gap-2" onClick={handleAdd}>
                <Plus className="h-4 w-4" />
                Ajouter au panier
              </Button>
            ) : (
              <p className="text-center text-sm text-destructive font-medium">
                Ce plat est indisponible pour le moment.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
