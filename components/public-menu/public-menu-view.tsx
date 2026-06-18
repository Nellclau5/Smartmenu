"use client";



import { useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { StickyCategoryNav } from "@/components/public-menu/sticky-category-nav";
import { MenuItemCard } from "@/components/public-menu/menu-item-card";
import { MenuSearchFilters } from "@/components/public-menu/menu-search-filters";
import { ThemeToggle } from "@/components/public-menu/theme-toggle";
import { OfflineCacheHint } from "@/components/public-menu/offline-cache-hint";
import { CartProvider } from "@/components/public-menu/cart-context";
import { OrderCart } from "@/components/public-menu/order-cart";
import { OrderTrackingAccess } from "@/components/public-menu/order-tracking-access";
import { getOrderedCategories, getRestaurantCategories } from "@/lib/categories";
import {
  DEFAULT_MENU_FILTERS,
  filterMenuItems,
  itemsByCategory as filterByCategory,
} from "@/lib/menu-utils";

import type { MenuCategory, MenuFilters, MenuItem, Restaurant } from "@/lib/supabase/types";



interface PublicMenuViewProps {

  restaurant: Restaurant;

  items: MenuItem[];

  demoMode?: boolean;

}



/** Vue menu public — header, recherche, catégories sticky, scroll fluide */

export function PublicMenuView({ restaurant, items, demoMode = false }: PublicMenuViewProps) {
  const menuCategories = useMemo(
    () => getRestaurantCategories(restaurant),
    [restaurant]
  );

  const [activeCategory, setActiveCategory] = useState<MenuCategory>(
    () => menuCategories[0] ?? "Plats"
  );

  const [filters, setFilters] = useState<MenuFilters>(DEFAULT_MENU_FILTERS);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});



  const filteredItems = useMemo(

    () => filterMenuItems(items, filters),

    [items, filters]

  );



  const isFiltering =
    filters.search.trim() !== "" ||
    filters.price !== "all";



  const itemsByCategory = (category: MenuCategory) =>

    filterByCategory(filteredItems, category);



  const visibleCategories = useMemo(
    () => getOrderedCategories(menuCategories, filteredItems),
    [menuCategories, filteredItems]
  );



  useEffect(() => {

    if (visibleCategories.length > 0 && !visibleCategories.includes(activeCategory)) {

      setActiveCategory(visibleCategories[0]);

    }

  }, [visibleCategories, activeCategory]);



  // Scroll spy — désactivé pendant une recherche active

  useEffect(() => {

    if (isFiltering) return;



    const observer = new IntersectionObserver(

      (entries) => {

        const visible = entries

          .filter((e) => e.isIntersecting)

          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);



        if (visible[0]) {

          const id = visible[0].target.id.replace("section-", "") as MenuCategory;

          setActiveCategory(id);

        }

      },

      { rootMargin: "-140px 0px -55% 0px", threshold: [0, 0.25, 0.5] }

    );



    visibleCategories.forEach((cat) => {

      const el = sectionRefs.current[cat];

      if (el) observer.observe(el);

    });



    return () => observer.disconnect();

  }, [filteredItems, isFiltering, visibleCategories]);



  function scrollToCategory(category: MenuCategory) {

    setActiveCategory(category);

    sectionRefs.current[category]?.scrollIntoView({ behavior: "smooth", block: "start" });

  }



  return (
    <CartProvider>
    <div className="min-h-dvh bg-background">

      {demoMode && (
        <div className="safe-top border-b border-primary/20 bg-primary/10 px-4 py-2.5 text-center text-sm">
          <span className="font-semibold text-primary">Mode démo</span>
          <span className="text-muted-foreground"> — Aperçu du menu client. </span>
          <Link href="/register" className="font-medium text-primary underline-offset-2 hover:underline">
            Créer mon menu
          </Link>
        </div>
      )}

      <OfflineCacheHint slug={restaurant.slug} />



      <header className="relative safe-top px-4 pb-2 pt-6 text-center">

        <OrderTrackingAccess
          slug={restaurant.slug}
          demoMode={demoMode}
          className="absolute left-4 top-6"
        />

        <ThemeToggle className="absolute right-4 top-6" />



        {restaurant.logo_url ? (

          <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full border-2 border-muted shadow-md ring-2 ring-primary/10">

            <Image

              src={restaurant.logo_url}

              alt={`Logo ${restaurant.name}`}

              fill

              className="object-cover"

              sizes="80px"

              priority

            />

          </div>

        ) : (

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-2 ring-primary/10">

            {restaurant.name.charAt(0)}

          </div>

        )}



        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">

          {restaurant.name}

        </h1>

        {restaurant.welcome_message && (

          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">

            {restaurant.welcome_message}

          </p>

        )}

        {restaurant.opening_hours && (

          <p className="mt-1 text-xs text-muted-foreground">{restaurant.opening_hours}</p>

        )}

      </header>



      <div className="px-4">

        <MenuSearchFilters

          filters={filters}

          onChange={setFilters}

          resultCount={filteredItems.length}

        />



        {!isFiltering && visibleCategories.length > 0 && (

          <StickyCategoryNav

            categories={visibleCategories}

            activeCategory={activeCategory}

            onCategoryClick={scrollToCategory}

          />

        )}



        <div className="mt-4 space-y-8 pb-32 safe-bottom">

          {filteredItems.length === 0 ? (

            <div className="rounded-2xl border border-dashed bg-card px-6 py-12 text-center">

              <p className="text-sm font-medium text-foreground">Aucun plat trouvé</p>

              <p className="mt-1 text-xs text-muted-foreground">

                Essayez un autre mot-clé ou retirez les filtres.

              </p>

            </div>

          ) : isFiltering ? (

            <section>

              <h2 className="mb-3 text-lg font-semibold text-foreground">Résultats</h2>

              <div className="space-y-3">

                {filteredItems.map((item) => (

                  <MenuItemCard key={item.id} item={item} showCategory />

                ))}

              </div>

            </section>

          ) : (

            visibleCategories.map((cat) => {

              const catItems = itemsByCategory(cat);

              if (catItems.length === 0) return null;



              return (

                <section

                  key={cat}

                  id={`section-${cat}`}

                  ref={(el) => {

                    sectionRefs.current[cat] = el;

                  }}

                  className="scroll-mt-36"

                >

                  <h2 className="mb-3 font-display text-lg font-semibold text-foreground">

                    {cat}

                  </h2>

                  <div className="space-y-3">

                    {catItems.map((item) => (

                      <MenuItemCard key={item.id} item={item} />

                    ))}

                  </div>

                </section>

              );

            })

          )}

        </div>

      </div>
      <OrderCart restaurant={restaurant} demoMode={demoMode} />
    </div>
    </CartProvider>
  );

}


