import { createBrowserClient } from "@supabase/ssr";
import { supabaseCookieOptions } from "@/lib/supabase/cookie-options";

/** Client Supabase côté navigateur — pour les composants 'use client' */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: supabaseCookieOptions }
  );
}
