"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Clock, Eye, QrCode, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { RestaurantAnalytics } from "@/lib/supabase/types";

const DAY_LABELS = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];

interface MenuAnalyticsPanelProps {
  restaurantId: string;
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}h`;
}

function scansTrend(current: number, previous: number): string | null {
  if (previous === 0) return current > 0 ? "Première activité enregistrée" : null;
  const diff = Math.round(((current - previous) / previous) * 100);
  if (diff === 0) return "Stable vs période précédente";
  return diff > 0 ? `+${diff}% vs période précédente` : `${diff}% vs période précédente`;
}

export function MenuAnalyticsPanel({ restaurantId }: MenuAnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<RestaurantAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .rpc("get_restaurant_analytics", {
        p_restaurant_id: restaurantId,
        p_days: 7,
      })
      .then(({ data, error }) => {
        if (!error && data) {
          setAnalytics(data as RestaurantAnalytics);
        }
        setLoading(false);
      });
  }, [restaurantId]);

  const peakHour = useMemo(() => {
    if (!analytics?.peak_hours.length) return null;
    return analytics.peak_hours.reduce((best, row) =>
      row.count > best.count ? row : best
    );
  }, [analytics]);

  const peakDay = useMemo(() => {
    if (!analytics?.peak_days.length) return null;
    return analytics.peak_days.reduce((best, row) =>
      row.count > best.count ? row : best
    );
  }, [analytics]);

  const maxHourCount = useMemo(
    () => Math.max(1, ...(analytics?.peak_hours.map((h) => h.count) ?? [1])),
    [analytics]
  );

  const maxDayCount = useMemo(
    () => Math.max(1, ...(analytics?.peak_days.map((d) => d.count) ?? [1])),
    [analytics]
  );

  if (loading) {
    return (
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const trend = scansTrend(analytics.scans_total, analytics.scans_previous_period);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Statistiques
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Activité de votre menu sur les 7 derniers jours
        </p>
      </div>

      {/* Scans */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-3xl font-bold">{analytics.scans_total.toLocaleString("fr-FR")}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                scans de votre menu cette semaine
              </p>
              {trend && (
                <p
                  className={cn(
                    "text-xs font-medium mt-2 flex items-center gap-1",
                    analytics.scans_total >= analytics.scans_previous_period
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  {trend}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plats les plus consultés */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Plats les plus consultés
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {analytics.top_dishes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Pas encore de données. Les vues apparaîtront quand vos clients ouvriront un plat.
            </p>
          ) : (
            analytics.top_dishes.map((dish, index) => (
              <div key={dish.menu_item_id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium truncate">
                    <span className="text-muted-foreground mr-1.5">{index + 1}.</span>
                    {dish.name}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {dish.share_pct}% · {dish.views} vues
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max(dish.share_pct, 4)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Heures de pointe */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Heures de pointe
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {analytics.scans_total === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Les heures de scan s&apos;afficheront dès les premières visites.
            </p>
          ) : (
            <>
              {peakHour && peakHour.count > 0 && (
                <p className="text-sm text-muted-foreground mb-4">
                  Pic d&apos;activité vers{" "}
                  <span className="font-semibold text-foreground">
                    {formatHour(peakHour.hour)}
                  </span>
                  {peakDay && peakDay.count > 0 && (
                    <>
                      {" "}
                      — surtout le{" "}
                      <span className="font-semibold text-foreground">
                        {DAY_LABELS[peakDay.day]?.replace(".", "")}
                      </span>
                    </>
                  )}
                </p>
              )}

              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Par heure (scans)
              </p>
              <div className="flex items-end gap-0.5 h-24">
                {analytics.peak_hours.map((row) => (
                  <div
                    key={row.hour}
                    className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0"
                    title={`${formatHour(row.hour)} : ${row.count} scan${row.count > 1 ? "s" : ""}`}
                  >
                    <div
                      className={cn(
                        "w-full rounded-t-sm min-h-[2px] transition-all",
                        row.count > 0 ? "bg-primary" : "bg-muted"
                      )}
                      style={{
                        height: `${Math.max(4, (row.count / maxHourCount) * 100)}%`,
                      }}
                    />
                    {row.hour % 3 === 0 && (
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                        {row.hour}h
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs font-medium text-muted-foreground mt-5 mb-2 uppercase tracking-wide">
                Par jour de la semaine
              </p>
              <div className="grid grid-cols-7 gap-1.5">
                {analytics.peak_days.map((row) => (
                  <div key={row.day} className="flex flex-col items-center gap-1">
                    <div className="w-full h-16 flex items-end">
                      <div
                        className={cn(
                          "w-full rounded-t-md min-h-[2px]",
                          row.count > 0 ? "bg-primary/80" : "bg-muted"
                        )}
                        style={{
                          height: `${Math.max(8, (row.count / maxDayCount) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{DAY_LABELS[row.day]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
