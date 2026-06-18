"use client";



import { useEffect } from "react";



/** Prépare le cache offline de la page menu via le Service Worker */

export function OfflineCacheHint({ slug }: { slug: string }) {

  useEffect(() => {

    if (!("serviceWorker" in navigator)) return;



    navigator.serviceWorker.ready

      .then((registration) => {

        registration.active?.postMessage({

          type: "CACHE_MENU",

          url: `${window.location.origin}/menu/${slug}`,

        });

      })

      .catch(() => {});

  }, [slug]);



  return null;

}


