"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type BeforeInstallPromptEvent,
  getInstallInstructions,
  isIosDevice,
  isPwaInstallSupported,
  isStandaloneMode,
} from "@/lib/pwa-install";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "smartmenu-pwa-install-dismissed";

interface PwaInstallBannerProps {
  className?: string;
  sticky?: boolean;
}

/** Propose l'installation PWA sur mobile et ordinateur */
export function PwaInstallBanner({ className, sticky = false }: PwaInstallBannerProps) {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  const ios = isIosDevice();
  const instructions = getInstallInstructions();

  useEffect(() => {
    if (!isPwaInstallSupported() || isStandaloneMode()) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    setVisible(true);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }, []);

  async function handleInstallClick() {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setVisible(false);
        }
        setDeferredPrompt(null);
      } finally {
        setInstalling(false);
      }
      return;
    }

    setInstructionsOpen(true);
  }

  if (!visible) return null;

  return (
    <>
      <div
        className={cn(
          "border-b border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-50/50",
          sticky && "sticky top-16 z-40",
          className
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Smartphone className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Installez Smart Menu</p>
            <p className="text-xs text-muted-foreground">
              {ios
                ? "Accédez à votre restaurant en un clic depuis l'écran d'accueil."
                : "Application web sur mobile ou ordinateur — rapide et toujours à portée de main."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleInstallClick}
              disabled={installing}
            >
              {ios ? (
                <>
                  <Share className="h-3.5 w-3.5" />
                  Comment faire
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  {installing ? "..." : "Installer"}
                </>
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={dismiss}
              aria-label="Masquer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{instructions.title}</DialogTitle>
            <DialogDescription>
              Installez Smart Menu pour un accès direct, sans passer par le navigateur.
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            {instructions.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {ios && (
            <p className="text-xs text-muted-foreground">
              Sur iOS, l&apos;installation se fait via Safari.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
