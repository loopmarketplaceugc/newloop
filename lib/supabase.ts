"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Live Supabase project (publishable key — safe in the client; RLS guards every table). */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://nylivxiyzxjdjsbdmrnw.supabase.co";
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55bGl2eGl5enhqZGpzYmRtcm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0Mzc3ODUsImV4cCI6MjA5ODAxMzc4NX0.gr4KBqv9Wdjk_JG3cUb4MkJtjILvwjQarlOe6k5LDkQ";

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) client = createClient(URL, KEY);
  return client;
}
