import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Smart Menu</h1>
        <p className="mt-2 text-muted-foreground">
          Menu QR dynamique pour votre restaurant
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
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
