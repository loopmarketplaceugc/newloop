"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Live Supabase project (publishable anon key — safe in the client; RLS guards
 * every table). Both values MUST come from the environment: no hardcoded
 * fallback, so a misconfigured deploy fails fast instead of silently pointing at
 * the wrong project.
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!URL || !KEY) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  if (!client) client = createClient(URL, KEY);
  return client;
}
