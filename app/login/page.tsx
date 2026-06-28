import Link from "next/link";
import { safeInternalPath } from "@/lib/safe-redirect";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;
  const redirectTo = safeInternalPath(redirect);

  return (
    <AuthCard
      title="Bon retour !"
      subtitle="Connectez-vous pour gérer votre menu digital"
      footer={
        <>
          Pas de compte ?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Créer un compte gratuit
          </Link>
        </>
      }
    >
      <LoginForm redirectTo={redirectTo} />
    </AuthCard>
  );
}
