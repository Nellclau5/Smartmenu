/** Valide qu'une redirection reste interne à l'application */
export function safeInternalPath(
  path: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!path) return fallback;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return fallback;
  }
  return path;
}
