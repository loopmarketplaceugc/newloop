"use client";

import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/store/session";
import type { Role } from "@/lib/types";

/**
 * Sign up with email+password; role stored in auth metadata.
 * Uses the `signup_instant` RPC (pre-confirmed user, no confirmation email — the
 * built-in mailer is rate-limited) and immediately signs in for a live session.
 */
export async function signUpWithEmail(email: string, password: string, role: Role) {
  const sb = supabase();
  const { data: rpcData, error: rpcError } = await sb.rpc("signup_instant", {
    p_email: email,
    p_password: password,
    p_role: role,
  });
  if (rpcError) throw new Error(rpcError.message.replace(/^.*?:\s*/, "") || "Signup failed — try again.");
  const existed = (rpcData as { status?: string } | null)?.status === "exists";

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    if (existed) {
      throw new Error("There is already an account with this email. Log in instead, or reset your password.");
    }
    throw new Error(error.message);
  }
  const userId = data.user.id;
  useSession.getState().setAuthed({ userId, role, email, onboarded: false });
  return { hasSession: true, userId };
}

const PENDING_KEY = "mcc-pending-profile";

function makeHandle(input: string, fallback: string) {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
  return `${base || fallback}.${Math.random().toString(36).slice(2, 6)}`;
}

/** Save any onboarding data parked before email confirmation. Safe to call anytime. */
export async function flushPendingProfile() {
  try {
    const pending = localStorage.getItem(PENDING_KEY);
    if (!pending) return;
    const parsed = JSON.parse(pending) as { kind: "creator" | "company"; payload: never };
    const ok =
      parsed.kind === "creator"
        ? await saveCreatorProfile(parsed.payload)
        : await saveCompanyProfile(parsed.payload);
    if (ok) localStorage.removeItem(PENDING_KEY);
  } catch {
    // non-fatal — profile can be completed from the dashboard
  }
}

/** Hydrate the session store from a live Supabase session (used by /auth/callback). */
export async function completeAuthFromSession() {
  const sb = supabase();
  const { data } = await sb.auth.getUser();
  const user = data.user;
  if (!user) return null;
  await flushPendingProfile();
  const metaRole = (user.user_metadata?.role as Role | undefined) ?? "creator";
  const { data: profile } = await sb
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .maybeSingle();
  useSession.getState().setAuthed({
    userId: user.id,
    role: (profile?.role as Role | undefined) ?? metaRole,
    name: profile?.name ?? "",
    email: user.email ?? "",
    onboarded: Boolean(profile),
  });
  return { onboarded: Boolean(profile), role: (profile?.role as Role | undefined) ?? metaRole };
}

/** Log in, load the profile, and hydrate the session store. */
export async function logInWithEmail(email: string, password: string) {
  const sb = supabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const userId = data.user.id;
  const metaRole = (data.user.user_metadata?.role as Role | undefined) ?? "creator";

  // Flush onboarding data captured before the email was confirmed
  await flushPendingProfile();

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

/** Send Supabase's password recovery email. */
export async function requestPasswordReset(email: string) {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Could not send reset email");
  }
}

/** Update the password while a recovery session is active. */
export async function updatePassword(password: string) {
  const { error } = await supabase().auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

/** Local MCC-tag generator — used for demo accounts and as an offline fallback. */
export function generateMccTag() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
  const block = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `MCC-${block()}-${block()}`;
}

/**
 * Mint (or fetch) the caller's unique MCC tag at certification.
 * Uses the `mint_mcc_tag` RPC for live accounts; falls back to a local tag when
 * there's no session (demo mode), so the certificate screen always has a code.
 */
export async function certifyCreator(): Promise<string> {
  try {
    const sb = supabase();
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return generateMccTag();
    const { data, error } = await sb.rpc("mint_mcc_tag");
    if (error || typeof data !== "string") return generateMccTag();
    return data;
  } catch {
    return generateMccTag();
  }
}

/** Simplified creator save — just nickname + platform follower counts (no URL required). */
export async function saveCreatorNickname(p: {
  nickname: string;
  platforms: { platform: string; followerCount: number }[];
}): Promise<boolean> {
  const sb = supabase();
  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return false;
  const handle = makeHandle(p.nickname, "creator");
  await sb.from("profiles").upsert({ id: uid, role: "creator", name: p.nickname, handle, status: "open" });
  await sb.from("creator_details").upsert({ profile_id: uid });
  if (p.platforms.length) {
    await sb.from("creator_platforms").upsert(
      p.platforms.map((pl) => ({ creator_id: uid, platform: pl.platform, url: "", follower_count: pl.followerCount })),
      { onConflict: "creator_id,platform" },
    );
  }
  return true;
}

/** Persist a creator profile after onboarding (no-op without a live auth session — RLS). */
export async function saveCreatorProfile(p: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  platforms: {
    platform: string;
    url: string;
    followerCount: number;
    postCount?: number;
    averageViews?: number;
  }[];
}) {
  const sb = supabase();
  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid) {
    // No confirmed session yet — park it; flushed automatically on first login
    localStorage.setItem(PENDING_KEY, JSON.stringify({ kind: "creator", payload: p }));
    return false;
  }
  const name = `${p.firstName} ${p.lastName}`.trim();
  const { error } = await sb.from("profiles").upsert({
    id: uid,
    role: "creator",
    handle: makeHandle(name, "creator"),
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
    const rows = p.platforms.map((pl) => ({
          creator_id: uid,
          platform: pl.platform,
          url: pl.url,
          follower_count: pl.followerCount,
          post_count: pl.postCount,
          average_views: pl.averageViews,
        }));
    const { error: platformError } = await sb.from("creator_platforms").upsert(
      rows,
      { onConflict: "creator_id,platform" },
    );
    if (platformError && /post_count|average_views|schema cache/i.test(platformError.message)) {
      await sb.from("creator_platforms").upsert(
        rows.map((row) => ({
          creator_id: row.creator_id,
          platform: row.platform,
          url: row.url,
          follower_count: row.follower_count,
        })),
        { onConflict: "creator_id,platform" },
      );
    }
  }
  return true;
}

/** Persist a company profile after onboarding. */
export async function saveCompanyProfile(p: {
  companyName: string;
  website: string;
  niche: string;
  budgetRange: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  balance?: string;
}) {
  const sb = supabase();
  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid) {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ kind: "company", payload: p }));
    return false;
  }
  const { error } = await sb.from("profiles").upsert({
    id: uid,
    role: "company",
    handle: makeHandle(p.companyName, "brand"),
    name: p.companyName,
    ...(p.firstName ? { first_name: p.firstName } : {}),
    ...(p.lastName ? { last_name: p.lastName } : {}),
    ...(p.email ? { email: p.email } : {}),
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
