import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Créer votre compte"
      subtitle="Menu QR, commandes en direct — prêt en quelques minutes"
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <LoginForm redirectTo="/dashboard" defaultSignUp />
    </AuthCard>
  );
}
