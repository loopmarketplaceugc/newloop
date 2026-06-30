"use client";

import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/store/session";
import type { Role } from "@/lib/types";

/**
 * Sign up with email+password.
 * First checks for cross-role email conflicts server-side, then calls the
 * standard Supabase signUp which sends a confirmation email. Returns
 * `needsVerification: true` so the UI can show the "check your inbox" screen.
 * If the Supabase project has email confirmations disabled a session is returned
 * immediately and needsVerification is false.
 */
export async function signUpWithEmail(email: string, password: string, role: Role) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, role, origin }),
  });

  const body = (await res.json().catch(() => null)) as {
    ok?: boolean;
    needsVerification?: boolean;
    session?: { access_token: string; refresh_token: string; user_id: string };
    error?: string;
  } | null;

  if (!res.ok) {
    throw new Error(body?.error ?? "Signup failed — try again.");
  }

  // Email confirmations disabled — session returned immediately
  if (!body?.needsVerification && body?.session) {
    const sb = supabase();
    await sb.auth.setSession({
      access_token: body.session.access_token,
      refresh_token: body.session.refresh_token,
    });
    useSession.getState().setAuthed({ userId: body.session.user_id, role, email, onboarded: false });
    return { needsVerification: false as const };
  }

  return { needsVerification: true as const };
}

const PENDING_KEY = "loop-pending-profile";

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
    const parsed = JSON.parse(pending) as { kind: "creator" | "nickname" | "company"; payload: never };
    const ok =
      parsed.kind === "creator"
        ? await saveCreatorProfile(parsed.payload)
        : parsed.kind === "nickname"
        ? await saveCreatorNickname(parsed.payload)
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
  // The DB trigger creates a stub profile row immediately on signup, so
  // Boolean(profile) is always true and can't be used as the onboarded signal.
  // Instead, check for the role-specific detail row (creator_details / companies)
  // which is only written during onboarding, never by the trigger.
  const { data: profile } = await sb
    .from("profiles")
    .select("role, name, creator_details(profile_id), companies(profile_id)")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profile?.role as Role | undefined) ?? metaRole;
  const detailRows = role === "company"
    ? (profile as { companies?: unknown[] } | null)?.companies
    : (profile as { creator_details?: unknown[] } | null)?.creator_details;
  const onboarded = Array.isArray(detailRows) ? detailRows.length > 0 : Boolean(detailRows);
  useSession.getState().setAuthed({
    userId: user.id,
    role,
    name: profile?.name ?? "",
    email: user.email ?? "",
    onboarded,
  });
  return { onboarded, role };
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

  // Same logic as completeAuthFromSession — the DB trigger always creates a stub
  // profile row, so we check the detail table to determine onboarded state.
  const { data: profile } = await sb
    .from("profiles")
    .select("role, name, creator_details(profile_id), companies(profile_id)")
    .eq("id", userId)
    .maybeSingle();

  const resolvedRole = (profile?.role as Role | undefined) ?? metaRole;
  const detailRows = resolvedRole === "company"
    ? (profile as { companies?: unknown[] } | null)?.companies
    : (profile as { creator_details?: unknown[] } | null)?.creator_details;
  const onboarded = Array.isArray(detailRows) ? detailRows.length > 0 : Boolean(detailRows);
  useSession.getState().setAuthed({
    userId,
    role: resolvedRole,
    name: profile?.name ?? "",
    email,
    onboarded,
  });
  return { onboarded, role: resolvedRole };
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

/** Local Loop-tag generator — used for demo accounts and as an offline fallback. */
export function generateLoopTag() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
  const block = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `LOOP-${block()}-${block()}`;
}

/**
 * Mint (or fetch) the caller's unique Loop tag at certification.
 * Uses the `mint_loop_tag` RPC for live accounts; falls back to a local tag when
 * there's no session (demo mode), so the certificate screen always has a code.
 */
export async function certifyCreator(): Promise<string> {
  try {
    const sb = supabase();
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return generateLoopTag();
    const { data, error } = await sb.rpc("mint_loop_tag");
    if (error || typeof data !== "string") return generateLoopTag();
    return data;
  } catch {
    return generateLoopTag();
  }
}

/** Simplified creator save — nickname, bio, niches, and platform follower counts. */
export async function saveCreatorNickname(p: {
  nickname: string;
  bio?: string;
  niches?: string[];
  platforms: { platform: string; followerCount: number }[];
}): Promise<boolean> {
  const sb = supabase();
  const { data } = await sb.auth.getUser();
  const uid = data.user?.id;
  if (!uid) {
    // No confirmed session yet — park it; flushed automatically on first login
    localStorage.setItem(PENDING_KEY, JSON.stringify({ kind: "nickname", payload: p }));
    return false;
  }
  const handle = makeHandle(p.nickname, "creator");
  await sb.from("profiles").upsert({
    id: uid,
    role: "creator",
    name: p.nickname,
    handle,
    status: "open",
    ...(p.bio ? { bio: p.bio } : {}),
  });
  await sb.from("creator_details").upsert({
    profile_id: uid,
    ...(p.niches?.length ? { niches: p.niches } : {}),
  });
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
  niches: string[];
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
    niches: p.niches,
    budget_range: p.budgetRange,
  });
  return true;
}
