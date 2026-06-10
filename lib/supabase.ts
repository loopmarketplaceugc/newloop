"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Live Supabase project (publishable key — safe in the client; RLS guards every table). */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://vqbykppxpplctrrrpomg.supabase.co";
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_vwNlA2H1SGDO3PhTIvTq5g_klN55qDj";

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) client = createClient(URL, KEY);
  return client;
}
