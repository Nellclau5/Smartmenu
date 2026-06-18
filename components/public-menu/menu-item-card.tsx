import { Badge } from "@/components/ui/badge";

import { Card, CardContent } from "@/components/ui/card";

import { MenuItemThumbnail } from "@/components/ui/menu-item-thumbnail";

import { formatPrice } from "@/lib/utils";

import { cn } from "@/lib/utils";

import type { MenuItem } from "@/lib/supabase/types";



interface MenuItemCardProps {

  item: MenuItem;

  showCategory?: boolean;

}



/** Carte plat côté client — typographie soignée, rupture de stock visible */

export function MenuItemCard({ item, showCategory = false }: MenuItemCardProps) {

  const unavailable = !item.is_available;



  return (

    <Card

      className={cn(

        "overflow-hidden border border-border/60 bg-card shadow-sm transition-opacity",

        unavailable && "opacity-55 grayscale-[0.6]"

      )}

    >

      <CardContent className="p-0">

        {item.image_url && (

          <MenuItemThumbnail

            imageUrl={item.image_url}

            name={item.name}

            size="lg"

            className="aspect-[16/9] max-h-44 rounded-none"

          />

        )}

        <div className="flex items-start justify-between gap-4 p-4">

          <div className="flex min-w-0 flex-1 gap-3">

            {!item.image_url && (

              <MenuItemThumbnail imageUrl={null} name={item.name} size="sm" />

            )}

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

                    Indisponible ce jour

                  </Badge>

                )}

              </div>

              {item.description && (

                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">

                  {item.description}

                </p>

              )}

            </div>

          </div>

          <p className="shrink-0 whitespace-nowrap font-display text-base font-bold text-primary">

            {formatPrice(Number(item.price))}

          </p>

        </div>

      </CardContent>

    </Card>

  );

}


