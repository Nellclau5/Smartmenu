"use client";

import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, User, LogOut, ClipboardList } from "lucide-react";
import { NotificationEnableBanner } from "@/components/notifications/notification-enable-banner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@/lib/supabase/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/dashboard/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/dashboard/orders", label: "Commandes", icon: ClipboardList },
  { href: "/dashboard/profile", label: "Profil", icon: User },
];

interface DashboardShellProps {
  restaurant: Restaurant;
  children: React.ReactNode;
}

export function DashboardShell({ restaurant, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-muted/30">
      {/* Sidebar desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col border-r bg-background">
        <div className="flex h-16 items-center border-b px-6">
          <AppLogo size={32} labelClassName="text-lg" />
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4">
          <p className="text-sm font-medium truncate">{restaurant.name}</p>
          <a
            href={`/menu/${restaurant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline truncate block mt-0.5"
            title={`/menu/${restaurant.slug}`}
          >
            Voir le menu public →
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="md:pl-64">
        <main className="mx-auto max-w-3xl pb-24 md:pb-8 md:px-6 md:py-8">
          <div className="px-4 pt-3 md:px-0 md:pt-0">
            <NotificationEnableBanner
              title="Alertes commandes"
              description="Son + notification à chaque nouvelle commande client."
            />
          </div>
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur md:hidden safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition-colors min-w-[72px]",
                pathname === href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
