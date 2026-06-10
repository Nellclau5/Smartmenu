export default function MenuNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Menu introuvable</h1>
      <p className="mt-2 text-muted-foreground">
        Ce restaurant n&apos;existe pas ou n&apos;est pas encore actif.
      </p>
    </div>
  );
}
