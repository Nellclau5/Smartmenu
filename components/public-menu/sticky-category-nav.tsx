"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/lib/supabase/types";

interface StickyCategoryNavProps {
  categories: MenuCategory[];
  activeCategory: MenuCategory;
  onCategoryClick: (category: MenuCategory) => void;
}

/** Barre de catégories horizontale collante au scroll */
export function StickyCategoryNav({
  categories,
  activeCategory,
  onCategoryClick,
}: StickyCategoryNavProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll horizontal pour centrer l'onglet actif
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeCategory]);

  return (
    <nav
      ref={navRef}
      aria-label="Catégories du menu"
      className="sticky top-0 z-20 -mx-4 border-b border-border/70 bg-background/95 px-4 py-2.5 backdrop-blur-md supports-[backdrop-filter]:bg-background/80"
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            ref={activeCategory === cat ? activeRef : undefined}
            type="button"
            onClick={() => onCategoryClick(cat)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
    </nav>
  );
}
