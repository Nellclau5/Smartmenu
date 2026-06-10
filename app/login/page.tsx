import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Smart Menu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connectez-vous pour gérer votre menu
          </p>
        </div>

        <LoginForm redirectTo={redirect ?? "/dashboard"} />

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
