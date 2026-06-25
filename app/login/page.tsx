import Link from "next/link";
import { safeInternalPath } from "@/lib/safe-redirect";
import { AppLogo } from "@/components/brand/app-logo";
import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center">
          <AppLogo size={48} />
          <p className="mt-3 text-sm text-muted-foreground">
            Connectez-vous pour gérer votre menu
          </p>
        </div>

        <LoginForm redirectTo={safeInternalPath(redirect)} />

        <p className="text-center text-sm text-muted-foreground">
          Pas de compte ?{" "}
          <Link href="/register" className="text-primary hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </main>
  );
}
