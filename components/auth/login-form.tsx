"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  createRestaurantForUser,
  seedSampleMenuItems,
} from "@/lib/restaurant";

interface LoginFormProps {
  redirectTo?: string;
  defaultSignUp?: boolean;
}

export function LoginForm({
  redirectTo = "/dashboard",
  defaultSignUp = false,
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(defaultSignUp);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace(redirectTo);
        router.refresh();
      } else {
        setCheckingSession(false);
      }
    });
  }, [redirectTo, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setLoading(false);
        setError(signUpError.message);
        return;
      }

      if (data.session && data.user) {
        const { restaurant, error: restError } = await createRestaurantForUser(
          supabase,
          data.user.id,
          restaurantName.trim() || "Mon Restaurant"
        );

        if (restError) {
          setLoading(false);
          setError(restError);
          return;
        }

        if (restaurant) {
          await seedSampleMenuItems(supabase, restaurant.id);
        }
      } else {
        setLoading(false);
        setError("Compte créé ! Confirmez votre email puis connectez-vous.");
        return;
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setLoading(false);
        setError(authError.message);
        return;
      }
    }

    setLoading(false);
    router.push(redirectTo);
    router.refresh();
  }

  if (checkingSession) {
    return (
      <div className="flex w-full max-w-sm items-center justify-center py-12 text-sm text-muted-foreground">
        Vérification de la session...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      {isSignUp && (
        <div className="space-y-2">
          <Label htmlFor="restaurant">Nom du restaurant</Label>
          <Input
            id="restaurant"
            type="text"
            placeholder="Ex: Le Bistrot"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="gerant@restaurant.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={isSignUp ? "new-password" : "current-password"}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button type="submit" className="w-full h-12" disabled={loading}>
        {loading
          ? "Chargement..."
          : isSignUp
            ? "Créer mon compte"
            : "Se connecter"}
      </Button>

      {!defaultSignUp && (
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignUp
            ? "Déjà un compte ? Se connecter"
            : "Pas de compte ? S'inscrire"}
        </button>
      )}
    </form>
  );
}
