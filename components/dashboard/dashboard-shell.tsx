"use client";

import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";
import { SubscriptionBanner } from "@/components/dashboard/subscription-banner";
import { usePathname } from "next/navigation";
import {
  Home,
  UtensilsCrossed,
  User,
  LogOut,
  ClipboardList,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { NotificationEnableBanner } from "@/components/notifications/notification-enable-banner";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  getEffectiveSubscriptionStatus,
  getTrialDaysRemaining,
} from "@/lib/subscription";
import type { Restaurant } from "@/lib/supabase/types";

const MAIN_NAV = [
  { href: "/dashboard", label: "Accueil", icon: Home, exact: true },
  { href: "/dashboard/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/dashboard/orders", label: "Commandes", icon: ClipboardList },
  { href: "/dashboard/profile", label: "Profil", icon: User },
];

const SECONDARY_NAV = [
  { href: "/dashboard/subscription", label: "Abonnement", icon: CreditCard },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface DashboardShellProps {
  restaurant: Restaurant;
  children: React.ReactNode;
}

export function DashboardShell({ restaurant, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const subStatus = getEffectiveSubscriptionStatus(restaurant);
  const daysLeft = getTrialDaysRemaining(restaurant.subscription_expires_at);
  const initial = restaurant.name.charAt(0).toUpperCase();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function navLinkClass(href: string, exact?: boolean) {
    const active = isActive(pathname, href, exact);
    return cn(
      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
      active
        ? "bg-primary/10 text-primary border-l-[3px] border-primary pl-[13px]"
        : "text-muted-foreground hover:bg-muted hover:text-foreground border-l-[3px] border-transparent pl-[13px]"
    );
  }

  return (
    <div className="min-h-dvh bg-muted/30">
      {/* Sidebar desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col border-r bg-background shadow-sm">
        <div className="border-b bg-gradient-to-br from-primary/10 via-background to-emerald-50/50 px-6 py-5">
          <AppLogo size={32} labelClassName="text-lg" />
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{restaurant.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {subStatus === "trial" && daysLeft !== null
                  ? `Essai · ${daysLeft}j restants`
                  : subStatus === "active"
                    ? "Abonnement actif"
                    : "Abonnement requis"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 p-4">
          <div>
            <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Principal
            </p>
            <div className="space-y-0.5">
              {MAIN_NAV.map(({ href, label, icon: Icon, exact }) => (
                <Link key={href} href={href} className={navLinkClass(href, exact)}>
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Compte
            </p>
            <div className="space-y-0.5">
              {SECONDARY_NAV.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={navLinkClass(href)}>
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t p-4 space-y-2">
          <a
            href={`/menu/${restaurant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            <span className="truncate">Voir le menu public</span>
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur md:hidden safe-top">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              {initial}
            </div>
            <p className="truncate text-sm font-semibold">{restaurant.name}</p>
          </div>
          <Link
            href="/dashboard/subscription"
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
              subStatus === "expired"
                ? "bg-destructive/10 text-destructive"
                : subStatus === "trial"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {subStatus === "trial" && daysLeft !== null
              ? `${daysLeft}j essai`
              : subStatus === "expired"
                ? "Expiré"
                : "Actif"}
          </Link>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="md:pl-72">
        <main className="mx-auto max-w-3xl pb-24 md:pb-8 md:px-6 md:py-8">
          <div className="px-4 pt-3 md:px-0 md:pt-0 space-y-3">
            <PwaInstallBanner />
            <NotificationEnableBanner
              title="Alertes commandes"
              description="Son + notification à chaque nouvelle commande client."
            />
            {pathname !== "/dashboard/subscription" && (
              <SubscriptionBanner restaurant={restaurant} />
            )}
          </div>
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur md:hidden safe-bottom">
        <div className="flex items-stretch justify-around px-1 py-1.5">
          {MAIN_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-colors min-w-0",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-110")} />
                <span className="truncate max-w-full px-1">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
