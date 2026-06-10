import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase is key-gated: with NEXT_PUBLIC_SUPABASE_URL/ANON_KEY set, the client
 * is live (schema + RLS in supabase/migrations). Without keys the app runs on
 * the seeded demo store — every surface works either way.
 */
export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

export const supabaseEnabled = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
