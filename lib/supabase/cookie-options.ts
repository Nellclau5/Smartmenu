import type { SerializeOptions } from "cookie";

/** Cookies persistants — session conservée après fermeture de la PWA */
export const supabaseCookieOptions: Partial<SerializeOptions> = {
  maxAge: 60 * 60 * 24 * 400,
  sameSite: "lax",
  path: "/",
};
