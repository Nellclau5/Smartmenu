"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/restaurant";
import { logoStoragePath, uploadImage } from "@/lib/upload-image";
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
        <h1 className="text-2xl font-bold tracking-tight">Profil restaurant</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Logo, horaires et message affichés sur votre menu public
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-none shadow-sm">
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
        {success && <p className="text-sm text-primary text-center font-medium">Profil enregistré ✓</p>}

        <Button type="submit" className="w-full h-12" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer le profil"}
        </Button>
      </form>

      <Card className="border-none shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div>
            <h2 className="font-semibold">Compte</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Déconnectez-vous pour changer de compte ou sécuriser l&apos;app sur cet appareil.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 gap-2 text-destructive hover:text-destructive"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Déconnexion..." : "Se déconnecter"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
