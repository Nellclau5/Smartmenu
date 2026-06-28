"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  ExternalLink,
  LogOut,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/restaurant";
import { logoStoragePath, uploadImage } from "@/lib/upload-image";
import {
  formatExpiryDate,
  formatPriceXof,
  getEffectiveSubscriptionStatus,
  getSubscriptionPriceXof,
  getTrialDaysRemaining,
  TRIAL_DAYS,
} from "@/lib/subscription";
import type { Restaurant } from "@/lib/supabase/types";

interface ProfileFormProps {
  restaurant: Restaurant;
}

export function ProfileForm({ restaurant: initial }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [openingHours, setOpeningHours] = useState(initial.opening_hours ?? "");
  const [welcomeMessage, setWelcomeMessage] = useState(initial.welcome_message ?? "");
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const effectiveStatus = getEffectiveSubscriptionStatus(initial);
  const daysLeft = getTrialDaysRemaining(initial.subscription_expires_at);
  const expiryLabel = formatExpiryDate(initial.subscription_expires_at);
  const price = getSubscriptionPriceXof();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setUserPhone(user.phone ?? null);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    let finalLogoUrl = logoUrl.trim() || null;

    if (logoFile) {
      const { url, error: uploadError } = await uploadImage(
        supabase,
        logoFile,
        logoStoragePath(initial.id, logoFile)
      );

      if (uploadError || !url) {
        setLoading(false);
        setError(uploadError ?? "Erreur upload logo");
        return;
      }
      finalLogoUrl = url;
      setLogoUrl(url);
      setLogoFile(null);
    }

    const newSlug = slugify(name);

    const { error: updateError } = await supabase
      .from("restaurants")
      .update({
        name: name.trim(),
        slug: newSlug,
        logo_url: finalLogoUrl,
        opening_hours: openingHours.trim() || null,
        welcome_message: welcomeMessage.trim() || null,
      })
      .eq("id", initial.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6 px-4 pt-6 md:px-0 md:pt-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Restaurant, compte et abonnement
        </p>
      </div>

      {/* Abonnement */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-emerald-50/50 dark:to-emerald-950/20">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Abonnement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                effectiveStatus === "active"
                  ? "default"
                  : effectiveStatus === "expired"
                    ? "destructive"
                    : "secondary"
              }
            >
              {effectiveStatus === "trial"
                ? `Essai gratuit · ${daysLeft ?? TRIAL_DAYS}j restants`
                : effectiveStatus === "active"
                  ? "Abonnement actif"
                  : "Essai terminé"}
            </Badge>
            {expiryLabel && (
              <span className="text-xs text-muted-foreground">
                {effectiveStatus === "trial"
                  ? `Fin le ${expiryLabel}`
                  : effectiveStatus === "active"
                    ? `Jusqu'au ${expiryLabel}`
                    : `Expiré le ${expiryLabel}`}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {effectiveStatus === "expired"
              ? `Votre essai de ${TRIAL_DAYS} jours est terminé. Abonnez-vous pour ${formatPriceXof(price)}/mois.`
              : effectiveStatus === "trial"
                ? `${TRIAL_DAYS} jours gratuits, puis ${formatPriceXof(price)}/mois pour continuer.`
                : "Merci ! Votre menu reste en ligne."}
          </p>
          {(effectiveStatus === "trial" || effectiveStatus === "expired") && (
            <Button asChild className="w-full rounded-xl">
              <Link href="/dashboard/subscription">
                {effectiveStatus === "expired" ? "S'abonner maintenant" : "Voir l'offre"}
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Compte utilisateur */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Mon compte
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {userEmail && (
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{userEmail}</p>
              </div>
            </div>
          )}
          {userPhone && (
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Téléphone</p>
                <p className="text-sm font-medium">{userPhone}</p>
              </div>
            </div>
          )}
          {!userEmail && !userPhone && (
            <p className="text-sm text-muted-foreground">
              Connecté via un fournisseur externe.
            </p>
          )}
          <a
            href={`/menu/${initial.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Voir le menu public
          </a>
        </CardContent>
      </Card>

      {/* Restaurant */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Restaurant</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col items-center gap-4">
              <ImageUpload
                label="Logo du restaurant"
                currentUrl={logoUrl}
                onFileSelect={setLogoFile}
                aspect="square"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nom du restaurant</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Horaires</Label>
              <Input
                id="hours"
                placeholder="Lun-Sam 11h-23h"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome">Message d&apos;accueil</Label>
              <textarea
                id="welcome"
                rows={3}
                placeholder="Bienvenue ! Découvrez nos spécialités..."
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        {success && (
          <p className="text-sm text-primary text-center font-medium">Profil enregistré ✓</p>
        )}

        <Button type="submit" className="w-full h-12 rounded-xl" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer le profil"}
        </Button>
      </form>

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 gap-2 rounded-xl text-destructive hover:text-destructive"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        <LogOut className="h-4 w-4" />
        {loggingOut ? "Déconnexion..." : "Se déconnecter"}
      </Button>
    </div>
  );
}
