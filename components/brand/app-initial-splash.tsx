"use client";

import { useEffect, useState } from "react";
import { AppLoadingScreen } from "@/components/brand/app-loading-screen";

/** Splash au premier chargement de l'app (disparaît une fois prête) */
export function AppInitialSplash() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const minDisplayMs = 600;
    const startedAt = Date.now();

    function hide() {
      const elapsed = Date.now() - startedAt;
      const delay = Math.max(0, minDisplayMs - elapsed);
      window.setTimeout(() => {
        setFadeOut(true);
        window.setTimeout(() => setVisible(false), 400);
      }, delay);
    }

    if (document.readyState === "complete") {
      hide();
    } else {
      window.addEventListener("load", hide, { once: true });
      return () => window.removeEventListener("load", hide);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-[400ms] ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden={fadeOut}
    >
      <AppLoadingScreen label="Ouverture de Smart Menu…" />
    </div>
  );
}
