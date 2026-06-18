import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Smart Menu</h1>
        <p className="mt-2 text-muted-foreground">
          Menu QR dynamique pour votre restaurant
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button asChild>
          <Link href="/login">Se connecter</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/register">Créer un compte</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/menu/demo">Voir un menu démo</Link>
        </Button>
      </div>
    </main>
  );
}
