"use client";

import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/store/session";
import type { Role } from "@/lib/types";

/** Sign up with email+password; role stored in auth metadata. Returns whether a live session exists. */
export async function signUpWithEmail(email: string, password: string, role: Role) {
  const sb = supabase();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { role } },
  });
  if (error) throw new Error(error.message);
  const userId = data.user?.id;
  if (!userId) throw new Error("Signup failed — try again.");
  useSession.getState().setAuthed({ userId, role, email, onboarded: false });
  return { hasSession: Boolean(data.session), userId };
}

/** Log in, load the profile, and hydrate the session store. */
export async function logInWithEmail(email: string, password: string) {
  const sb = supabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const userId = data.user.id;
  const metaRole = (data.user.user_metadata?.role as Role | undefined) ?? "creator";

  const { data: profile } = await sb
    .from("profiles")
    .select("role, name")
    .eq("id", userId)
    .maybeSingle();

  useSession.getState().setAuthed({
    userId,
    role: (profile?.role as Role | undefined) ?? metaRole,
    name: profile?.name ?? "",
    email,
    onboarded: Boolean(profile),
  });
  return { onboarded: Boolean(profile) };
}

/** Persist a creator profile after onboarding (no-op without a live auth session — RLS). */
export async function saveCreatorProfile(p: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  platforms: { platform: string; followerCount: number }[];
}) {
  const sb = supabase();
  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return false;
  const name = `${p.firstName} ${p.lastName}`.trim();
  const { error } = await sb.from("profiles").upsert({
    id: uid,
    role: "creator",
    name,
    first_name: p.firstName,
    last_name: p.lastName,
    phone: p.phone,
    email: p.email,
    status: "open",
  });
  if (error) return false;
  await sb.from("creator_details").upsert({ profile_id: uid });
  if (p.platforms.length) {
    await sb.from("creator_platforms").upsert(
      p.platforms.map((pl) => ({
        creator_id: uid,
        platform: pl.platform,
        follower_count: pl.followerCount,
      })),
      { onConflict: "creator_id,platform" },
    );
  }
  return true;
}

/** Persist a company profile after onboarding. */
export async function saveCompanyProfile(p: {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  website: string;
  niche: string;
  budgetRange: string;
}) {
  const sb = supabase();
  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return false;
  const { error } = await sb.from("profiles").upsert({
    id: uid,
    role: "company",
    name: p.companyName,
    first_name: p.firstName,
    last_name: p.lastName,
    email: p.email,
  });
  if (error) return false;
  await sb.from("companies").upsert({
    profile_id: uid,
    company_name: p.companyName,
    website: p.website,
    niche: p.niche,
    budget_range: p.budgetRange,
  });
  return true;
}
