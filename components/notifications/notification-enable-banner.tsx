"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getNotificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications";

interface NotificationEnableBannerProps {
  title?: string;
  description?: string;
  className?: string;
}

/** Demande la permission notifications — uniquement au clic (requis mobile) */
export function NotificationEnableBanner({
  title = "Activer les notifications",
  description = "Recevez une alerte sonore et visuelle à chaque événement important.",
  className,
}: NotificationEnableBannerProps) {
  const [permission, setPermission] = useState(getNotificationPermission);
  const [loading, setLoading] = useState(false);

  if (permission === "unsupported" || permission === "granted") {
    return null;
  }

  async function handleEnable() {
    setLoading(true);
    const granted = await requestNotificationPermission();
    setPermission(granted ? "granted" : getNotificationPermission());
    setLoading(false);
  }

  return (
    <Card className={className ?? "border-primary/30 bg-primary/5 shadow-none"}>
      <CardContent className="p-4 flex items-center gap-3">
        <Bell className="h-8 w-8 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          {permission === "denied" && (
            <p className="text-xs text-destructive mt-1">
              Bloquées par le navigateur — autorisez-les dans les réglages du site.
            </p>
          )}
        </div>
        {permission !== "denied" && (
          <Button size="sm" onClick={handleEnable} disabled={loading}>
            {loading ? "..." : "Activer"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
