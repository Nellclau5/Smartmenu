"use client";



import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

import type { MenuFilters, PriceFilter } from "@/lib/supabase/types";



interface MenuSearchFiltersProps {

  filters: MenuFilters;

  onChange: (filters: MenuFilters) => void;

  resultCount: number;

}



const PRICE_OPTIONS: { value: PriceFilter; label: string }[] = [

  { value: "all", label: "Tous prix" },

  { value: "budget", label: "< 2 000" },

  { value: "mid", label: "2 000 – 5 000" },

  { value: "premium", label: "> 5 000" },

];



/** Barre de recherche + filtres rapides côté client */

export function MenuSearchFilters({

  filters,

  onChange,

  resultCount,

}: MenuSearchFiltersProps) {

  const hasActiveFilters =

    filters.search ||

    filters.vegetarian ||

    filters.spicy ||

    filters.price !== "all";



  function update(partial: Partial<MenuFilters>) {

    onChange({ ...filters, ...partial });

  }



  function clearAll() {

    onChange({

      search: "",

      vegetarian: false,

      spicy: false,

      price: "all",

    });

  }



  return (

    <div className="space-y-3 pb-3">

      <div className="relative">

        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <input

          type="search"

          value={filters.search}

          onChange={(e) => update({ search: e.target.value })}

          placeholder="Rechercher un plat..."

          className="h-11 w-full rounded-2xl border border-input bg-card pl-10 pr-10 text-sm shadow-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"

          aria-label="Rechercher un plat"

        />

        {filters.search && (

          <button

            type="button"

            onClick={() => update({ search: "" })}

            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"

            aria-label="Effacer la recherche"

          >

            <X className="h-4 w-4" />

          </button>

        )}

      </div>



      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">

        <FilterChip

          active={filters.vegetarian}

          onClick={() => update({ vegetarian: !filters.vegetarian })}

        >

          🌱 Végétarien

        </FilterChip>

        <FilterChip

          active={filters.spicy}

          onClick={() => update({ spicy: !filters.spicy })}

        >

          🌶️ Épicé

        </FilterChip>

        {PRICE_OPTIONS.map((opt) => (

          <FilterChip

            key={opt.value}

            active={filters.price === opt.value}

            onClick={() => update({ price: opt.value })}

          >

            {opt.label}

          </FilterChip>

        ))}

      </div>



      {hasActiveFilters && (

        <div className="flex items-center justify-between text-xs text-muted-foreground">

          <span>

            {resultCount} plat{resultCount !== 1 ? "s" : ""} trouvé

            {resultCount !== 1 ? "s" : ""}

          </span>

          <button

            type="button"

            onClick={clearAll}

            className="font-medium text-primary hover:underline"

          >

            Réinitialiser

          </button>

        </div>

      )}

    </div>

  );

}



function FilterChip({

  active,

  onClick,

  children,

}: {

  active: boolean;

  onClick: () => void;

  children: React.ReactNode;

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      className={cn(

        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",

        active

          ? "border-primary bg-primary/10 text-primary"

          : "border-border bg-card text-muted-foreground hover:bg-muted"

      )}

    >

      {children}

    </button>

  );

}


