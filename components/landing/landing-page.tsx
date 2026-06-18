"use client";

import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";
import { useState } from "react";
import {
  Bell,
  ChefHat,
  ClipboardList,
  LayoutGrid,
  Menu,
  QrCode,
  ShoppingBag,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: QrCode,
    title: "Menu QR en un clic",
    description:
      "Vos clients scannent et consultent votre carte sur leur téléphone — plus besoin d'imprimer.",
  },
  {
    icon: ShoppingBag,
    title: "Commandes en direct",
    description:
      "Panier intégré, numéro de table et suivi de commande pour vos clients en salle.",
  },
  {
    icon: Bell,
    title: "Notifications instantanées",
    description:
      "Chaque nouvelle commande vous alerte en temps réel, même sur mobile.",
  },
  {
    icon: LayoutGrid,
    title: "Catégories sur mesure",
    description:
      "Entrées, cocktails, desserts… Organisez votre carte comme vous l'entendez.",
  },
  {
    icon: Smartphone,
    title: "App installable (PWA)",
    description:
      "Installez Smart Menu sur votre écran d'accueil et gérez votre restaurant partout.",
  },
  {
    icon: Zap,
    title: "Mise à jour immédiate",
    description:
      "Plat du jour, rupture de stock ou nouveau prix — vos clients voient la version à jour.",
  },
];

const steps = [
  {
    step: "01",
    title: "Créez votre compte",
    description: "Inscription gratuite en moins de 2 minutes, sans carte bancaire.",
  },
  {
    step: "02",
    title: "Composez votre menu",
    description: "Ajoutez vos plats, photos et catégories depuis votre tableau de bord.",
  },
  {
    step: "03",
    title: "Partagez votre QR code",
    description: "Affichez le code sur vos tables et recevez vos premières commandes.",
  },
];

const navLinks = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "/menu/demo", label: "Démo" },
];

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-40 h-[400px] w-[400px] rounded-full bg-emerald-300/20 blur-3xl"
      />

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg safe-top">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <AppLogo size={36} labelClassName="text-lg" />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Connexion</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Commencer gratuitement</Link>
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-background px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                <Button variant="outline" asChild>
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Commencer gratuitement</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <PwaInstallBanner sticky />

      <main>
        <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-20 lg:pb-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <Badge className="mb-5 gap-1.5 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5" />
                La carte digitale pour restaurants
              </Badge>

              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                Votre menu digital,{" "}
                <span className="text-primary">prêt en quelques minutes</span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground lg:mx-0">
                Créez un menu QR moderne, recevez les commandes en temps réel et
                offrez une expérience fluide à vos clients — depuis votre téléphone
                ou votre ordinateur.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <Link href="/register">
                    <ChefHat className="h-4 w-4" />
                    Créer mon menu gratuitement
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                  asChild
                >
                  <Link href="/menu/demo">Voir la démo</Link>
                </Button>
              </div>

              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground lg:justify-start">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Sans engagement
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Prêt en 5 min
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Optimisé mobile
                </li>
              </ul>
            </div>

            <PhonePreview />
          </div>
        </section>

        <section
          id="fonctionnalites"
          className="border-y border-border bg-muted/40 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Tout ce dont votre restaurant a besoin
              </h2>
              <p className="mt-4 text-muted-foreground">
                Une solution complète pour digitaliser votre carte et simplifier
                la prise de commande, sans complexité technique.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="comment-ca-marche"
          className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Lancez-vous en 3 étapes
            </h2>
            <p className="mt-4 text-muted-foreground">
              Pas de formation, pas d&apos;intégration compliquée. Vous êtes
              opérationnel dès aujourd&apos;hui.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((item, index) => (
              <div key={item.step} className="relative text-center md:text-left">
                {index < steps.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-border md:block"
                  />
                )}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground md:mx-0">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12 sm:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/10 blur-2xl"
            />

            <ClipboardList className="mx-auto h-10 w-10 opacity-90" />
            <h2 className="relative mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Prêt à moderniser votre restaurant ?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/85">
              Rejoignez les restaurateurs qui proposent déjà une expérience
              digitale à leurs clients. Créez votre compte et publiez votre menu
              dès maintenant.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-white/30 bg-white text-primary hover:bg-white/90 sm:w-auto"
                asChild
              >
                <Link href="/register">Créer mon compte</Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="w-full text-primary-foreground hover:bg-white/10 sm:w-auto"
                asChild
              >
                <Link href="/login">J&apos;ai déjà un compte</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-muted/30 safe-bottom">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <AppLogo size={28} labelClassName="font-medium text-foreground" />
          <p>Menu QR dynamique pour restaurants</p>
          <div className="flex gap-4">
            <Link href="/menu/demo" className="hover:text-foreground">
              Démo
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Connexion
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Inscription
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PhonePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[320px] lg:max-w-none lg:justify-self-end">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 scale-110 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-emerald-200/30 to-transparent blur-2xl"
      />

      <div className="relative mx-auto w-[280px] rounded-[2.5rem] border-[6px] border-foreground/90 bg-foreground p-2 shadow-2xl sm:w-[300px]">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-foreground" />

        <div className="overflow-hidden rounded-[1.75rem] bg-background">
          <div className="bg-primary px-4 pb-4 pt-10 text-primary-foreground">
            <p className="text-xs font-medium opacity-80">Le Bistrot du Coin</p>
            <h3 className="mt-0.5 text-lg font-bold">Notre carte</h3>
            <p className="mt-1 text-xs opacity-75">Bienvenue — bon appétit !</p>
          </div>

          <div className="space-y-3 p-3">
            <div className="flex gap-2 overflow-hidden">
              {["Entrées", "Plats", "Desserts"].map((cat, i) => (
                <span
                  key={cat}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                    i === 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {cat}
                </span>
              ))}
            </div>

            {[
              { name: "Salade du chef", price: "12,50 €", tag: "Végétarien" },
              { name: "Burger maison", price: "16,90 €", tag: "Best-seller" },
              { name: "Tarte du jour", price: "8,50 €", tag: "Dessert" },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5"
              >
                <div className="h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br from-primary/30 to-emerald-200/50" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.tag}</p>
                </div>
                <p className="text-sm font-semibold text-primary">{item.price}</p>
              </div>
            ))}

            <div className="flex items-center justify-between rounded-xl bg-primary px-3 py-2.5 text-primary-foreground">
              <span className="text-xs font-medium">Panier · 2 articles</span>
              <span className="text-sm font-bold">29,40 €</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -left-4 top-16 hidden rounded-2xl border border-border bg-card p-3 shadow-lg sm:block lg:-left-12">
        <QrCode className="h-8 w-8 text-primary" />
        <p className="mt-1 text-xs font-medium">Scan & commande</p>
      </div>

      <div className="absolute -right-2 bottom-20 hidden rounded-2xl border border-border bg-card p-3 shadow-lg sm:block lg:-right-8">
        <Bell className="h-6 w-6 text-primary" />
        <p className="mt-1 text-xs font-medium">Nouvelle commande !</p>
      </div>
    </div>
  );
}
