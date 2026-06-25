/** URL publique de l'application (fallback serveur sans requête HTTP) */
export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function getAllowedOrigins(): string[] {
  const origins = new Set<string>([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) origins.add(configured);

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  return [...origins];
}

function isAllowedOrigin(origin: string): boolean {
  const normalized = origin.replace(/\/$/, "");
  return getAllowedOrigins().includes(normalized);
}

/** URL de l'app pour les redirections paiement (origines autorisées uniquement) */
export function getAppUrlFromRequest(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin && isAllowedOrigin(origin)) {
    return origin.replace(/\/$/, "");
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (isAllowedOrigin(refOrigin)) return refOrigin;
    } catch {
      // ignore
    }
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    const candidate = `${proto}://${host}`.replace(/\/$/, "");
    if (isAllowedOrigin(candidate)) return candidate;
  }

  return getAppUrl();
}
