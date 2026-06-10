import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Créer un compte</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lancez votre menu QR en 2 minutes
          </p>
        </div>

        <LoginForm redirectTo="/dashboard" defaultSignUp />

        <p className="text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
