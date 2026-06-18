"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Rafraîchit la session Supabase au retour sur l'app (PWA / onglet) */
export function AuthSessionRefresh() {
  useEffect(() => {
    const supabase = createClient();

    function refreshSession() {
      void supabase.auth.getSession();
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshSession();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refreshSession);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refreshSession);
    };
  }, []);

  return null;
}
