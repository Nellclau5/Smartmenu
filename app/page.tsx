import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Smart Menu — Menu QR & commandes pour restaurants",
  description:
    "Créez un menu digital moderne, recevez les commandes en temps réel et offrez une expérience fluide à vos clients. Gratuit pour démarrer.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LandingPage isLoggedIn={!!user} />;
}
