"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NotifyPayload } from "@/lib/notifications";

interface ActiveAlert extends NotifyPayload {
  id: number;
}

/** Bannières d'alerte in-app (toujours visibles même sans permission système) */
export function InAppNotificationHost() {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);

  const dismiss = useCallback((id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  useEffect(() => {
    let nextId = 0;

    function onNotify(event: Event) {
      const detail = (event as CustomEvent<NotifyPayload>).detail;
      if (!detail?.title) return;

      const id = ++nextId;
      setAlerts((prev) => [{ ...detail, id }, ...prev].slice(0, 3));

      window.setTimeout(() => dismiss(id), 12000);
    }

    window.addEventListener("smartmenu:notify", onNotify);
    return () => window.removeEventListener("smartmenu:notify", onNotify);
  }, [dismiss]);

  if (alerts.length === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex flex-col gap-2 p-3 safe-top pointer-events-none"
      aria-live="polite"
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            "pointer-events-auto mx-auto w-full max-w-md rounded-2xl border border-primary/30",
            "bg-primary text-primary-foreground shadow-2xl animate-in slide-in-from-top-2"
          )}
        >
          <div className="flex items-start gap-3 p-4">
            <Bell className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">{alert.title}</p>
              {alert.body && (
                <p className="text-sm opacity-90 mt-0.5">{alert.body}</p>
              )}
              {alert.url && (
                <Link
                  href={alert.url}
                  className="inline-block text-xs font-medium underline mt-2 opacity-90"
                  onClick={() => dismiss(alert.id)}
                >
                  Voir →
                </Link>
              )}
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg p-1 opacity-80 hover:opacity-100"
              onClick={() => dismiss(alert.id)}
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
