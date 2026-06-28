import Image from "next/image";
import { cn } from "@/lib/utils";

interface AppLoadingScreenProps {
  label?: string;
  /** Plein écran (défaut) ou bloc compact dans une page */
  compact?: boolean;
  className?: string;
}

/** Écran de chargement avec logo Smart Menu */
export function AppLoadingScreen({
  label = "Chargement…",
  compact = false,
  className,
}: AppLoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5",
        compact ? "py-16" : "min-h-dvh w-full",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-3xl bg-primary/20 animate-ping scale-110" />
        <Image
          src="/icons/logo.png"
          alt="Smart Menu"
          width={compact ? 64 : 88}
          height={compact ? 64 : 88}
          className="relative rounded-3xl shadow-lg ring-4 ring-primary/10"
          priority
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="font-semibold text-lg tracking-tight text-foreground">Smart Menu</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-[loading-bar_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
