"use client";

import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";
import { Badge } from "@/components/ui/badge";
import { TRIAL_DAYS } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showTrialBadge?: boolean;
  className?: string;
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  showTrialBadge = true,
  className,
}: AuthCardProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-muted/30">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
        <Link
          href="/"
          className="mb-8 flex justify-center transition-opacity hover:opacity-80"
        >
          <AppLogo size={44} labelClassName="text-xl" />
        </Link>

        <div
          className={cn(
            "rounded-3xl border border-border/60 bg-background/95 p-6 shadow-xl backdrop-blur sm:p-8",
            className
          )}
        >
          <div className="mb-6 text-center">
            {showTrialBadge && (
              <Badge variant="secondary" className="mb-3 gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {TRIAL_DAYS} jours d&apos;essai gratuit
              </Badge>
            )}
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
