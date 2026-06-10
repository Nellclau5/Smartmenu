"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MenuItemThumbnail } from "@/components/ui/menu-item-thumbnail";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { MenuItem } from "@/lib/supabase/types";

interface MenuItemCardProps {
  item: MenuItem;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, available: boolean) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}

/** Carte plat mobile-first avec toggle, édition, tri et suppression */
export function MenuItemCard({
  item,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onToggle,
  onMove,
}: MenuItemCardProps) {
  const [isAvailable, setIsAvailable] = useState(item.is_available);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleToggle(checked: boolean) {
    setIsAvailable(checked);
    setLoading(true);

    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: checked })
      .eq("id", item.id);

    setLoading(false);
    if (error) {
      setIsAvailable(!checked);
      return;
    }
    onToggle(item.id, checked);
  }

  async function handleDelete() {
    if (!confirm(`Supprimer « ${item.name} » ?`)) return;

    const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
    if (!error) onDelete(item.id);
  }

  return (
    <Card className={`border-none shadow-sm ${!isAvailable ? "opacity-70" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <MenuItemThumbnail
            imageUrl={item.image_url}
            name={item.name}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-foreground">{item.name}</p>
              {!isAvailable && (
                <Badge variant="destructive" className="text-[10px]">Rupture</Badge>
              )}
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
            )}
            <p className="text-base font-bold text-primary mt-2">
              {formatPrice(Number(item.price))}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1 shrink-0">
            <span className="text-[10px] text-muted-foreground">Dispo</span>
            <Switch
              checked={isAvailable}
              onCheckedChange={handleToggle}
              disabled={loading}
              aria-label={`Disponibilité de ${item.name}`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              disabled={isFirst}
              onClick={() => onMove(item.id, "up")}
              aria-label="Monter"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              disabled={isLast}
              onClick={() => onMove(item.id, "down")}
              aria-label="Descendre"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => onEdit(item)}
              aria-label="Modifier"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive"
              onClick={handleDelete}
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
