"use client";

import { useEffect } from "react";

/**
 * Enregistrement du Service Worker pour la PWA.
 * Placez votre sw.js dans /public/sw.js (généré par next-pwa ou manuel).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // En dev, le SW perturbe le hot-reload — actif en production (npm start)
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch(console.error);
  }, []);

  return null;
}
