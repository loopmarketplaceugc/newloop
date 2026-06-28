"use client";

import { supabase } from "@/lib/supabase";
import type {
  Contract,
  Creator,
  Deliverable,
  Gig,
  GigStatus,
  Message,
  MessageKind,
  OfferBody,
  Platform,
  Review,
  Transaction,
} from "@/lib/types";
import { tierForFollowers } from "@/lib/types";
import { platformFeeCents } from "@/lib/gig-machine";

/* ---------- row types ---------- */

interface ProfileRow {
  id: string;
  role: "creator" | "company";
  handle?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  bio: string | null;
  location: string | null;
  status: "open" | "busy" | "away";
  avatar_hue?: number | null;
  loop_tag?: string | null;
  stripe_account_id?: string | null;
  stripe_payouts_enabled?: boolean | null;
  balance_cents?: number | null;
  created_at: string;
}

interface DetailsRow {
  profile_id: string;
  base_rate_cents: number;
  usage_upcharge_pct: number;
  raw_upcharge_pct: number;
  capacity_per_week: number;
  compensation_pref: Creator["compensationPref"];
  niches: string[];
  media_kit_url: string | null;
}

interface PlatformRow {
  creator_id: string;
  platform: Platform;
  url: string;
  follower_count: number;
  post_count?: number | null;
  average_views?: number | null;
}

interface GigRow {
  id: string;
  company_id: string;
  creator_id: string;
  status: GigStatus;
  title: string;
  brief: string | null;
  platform?: Platform | null;
  price_cents: number;
  fee_cents: number;
  usage_days: number;
  usage_expires_at: string | null;
  raw_footage: boolean;
  physical_product?: boolean | null;
  deadline: string | null;
  delivered_at?: string | null;
  tracking_number: string | null;
  revision_count?: number | null;
  min_post_lifetime_days?: number | null;
  revision_rounds?: number | null;
  video_length_seconds?: number | null;
  published_url?: string | null;
  published_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

interface MessageRow {
  id: string;
  gig_id: string;
  sender_id: string;
  kind: MessageKind;
  body: { text?: string; attachmentName?: string; offer?: OfferBody };
  created_at: string;
}

/* ---------- mappers ---------- */

export function mapCreator(p: ProfileRow, d?: DetailsRow | null, platforms: PlatformRow[] = []): Creator {
  const followers = platforms.reduce((s, x) => s + x.follower_count, 0);
  return {
    id: p.id,
    handle: p.handle ?? `creator-${p.id.slice(0, 8)}`,
    name: p.name || "Creator",
    avatarHue: p.avatar_hue ?? 285,
    avatarUrl: p.avatar_url ?? undefined,
    bio: p.bio ?? "",
    location: p.location ?? "",
    status: p.status,
    tier: tierForFollowers(followers),
    platforms: platforms.map((x) => ({
      platform: x.platform,
      url: x.url,
      followerCount: x.follower_count,
      postCount: x.post_count ?? undefined,
      averageViews: x.average_views ?? undefined,
    })),
    niches: (d?.niches ?? []) as Creator["niches"],
    baseRateCents: d?.base_rate_cents ?? 0,
    usageUpchargePct: d?.usage_upcharge_pct ?? 30,
    rawUpchargePct: d?.raw_upcharge_pct ?? 40,
    capacityPerWeek: d?.capacity_per_week ?? 3,
    slotsBooked: 0,
    compensationPref: d?.compensation_pref ?? "product_plus",
    rating: 0,
    reviewCount: 0,
    completedGigs: 0,
    portfolio: [],
    mediaKitUrl: d?.media_kit_url ?? undefined,
    joinedAt: p.created_at,
    loopTag: p.loop_tag ?? undefined,
    stripeAccountId: p.stripe_account_id ?? undefined,
    stripePayoutsEnabled: p.stripe_payouts_enabled ?? undefined,
    balanceCents: p.balance_cents ?? 0,
  };
}

export function mapGig(g: GigRow): Gig {
  return {
    id: g.id,
    companyId: g.company_id,
    creatorId: g.creator_id,
    status: g.status,
    title: g.title,
    brief: g.brief ?? "",
    platform: g.platform ?? "tiktok",
    priceCents: g.price_cents,
    feeCents: g.fee_cents,
    usageDays: g.usage_days,
    usageExpiresAt: g.usage_expires_at ?? undefined,
    rawFootage: g.raw_footage,
    physicalProduct: g.physical_product ?? false,
    trackingNumber: g.tracking_number ?? undefined,
    deadline: g.deadline ?? undefined,
    deliveredAt: g.delivered_at ?? undefined,
    revisionCount: g.revision_count ?? 0,
    createdAt: g.created_at,
    minPostLifetimeDays: g.min_post_lifetime_days ?? undefined,
    revisionRounds: g.revision_rounds ?? undefined,
    videoLengthSeconds: g.video_length_seconds ?? undefined,
    publishedUrl: g.published_url ?? undefined,
    publishedAt: g.published_at ?? undefined,
    completedAt: g.completed_at ?? undefined,
  };
}

export function mapMessage(m: MessageRow): Message {
  return {
    id: m.id,
    gigId: m.gig_id,
    senderId: m.sender_id,
    kind: m.kind,
    text: m.body?.text,
    attachmentName: m.body?.attachmentName,
    offer: m.body?.offer,
    createdAt: m.created_at,
  };
}

/* ---------- fetchers ---------- */

/** All creators with a published profile — powers Discover. */
export async function fetchCreators(): Promise<Creator[]> {
  try {
    const sb = supabase();
    const { data: profiles } = await sb.from("profiles").select("*").eq("role", "creator");
    if (!profiles?.length) return [];
    const ids = profiles.map((p) => p.id);
    const [{ data: details }, { data: platforms }] = await Promise.all([
      sb.from("creator_details").select("*").in("profile_id", ids),
      sb.from("creator_platforms").select("*").in("creator_id", ids),
    ]);
    return (profiles as ProfileRow[]).map((p) =>
      mapCreator(
        p,
        (details as DetailsRow[] | null)?.find((d) => d.profile_id === p.id),
        ((platforms as PlatformRow[] | null) ?? []).filter((x) => x.creator_id === p.id),
      ),
    );
  } catch {
    return [];
  }
}

/** Everything the signed-in user can see: their gigs, those threads, and counterparty profiles. */
export async function fetchMyWorld() {
  try {
  const sb = supabase();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;

  const { data: gigRows } = await sb.from("gigs").select("*").order("created_at", { ascending: false });
  const gigs = ((gigRows as GigRow[] | null) ?? []).map(mapGig);
  const gigIds = gigs.map((g) => g.id);

  let messages: Message[] = [];
  let contracts: Contract[] = [];
  let deliverables: Deliverable[] = [];
  let transactions: Transaction[] = [];
  if (gigIds.length) {
    const [{ data: msgRows }, { data: contractRows }, { data: delRows }, { data: txRows }] = await Promise.all([
      sb.from("messages").select("*").in("gig_id", gigIds).order("created_at"),
      sb.from("contracts").select("*").in("gig_id", gigIds),
      sb.from("deliverables").select("*").in("gig_id", gigIds),
      sb.from("transactions").select("*").in("gig_id", gigIds),
    ]);
    messages = ((msgRows as MessageRow[] | null) ?? []).map(mapMessage);
    contracts = (contractRows ?? []).map((c) => ({
      gigId: c.gig_id as string,
      terms: c.terms as Contract["terms"],
      companySignedAt: (c.company_signed_at as string) ?? undefined,
      creatorSignedAt: (c.creator_signed_at as string) ?? undefined,
    }));
    deliverables = (delRows ?? []).map((d) => {
      const path = d.storage_path as string;
      const isUrl = path.startsWith("http://") || path.startsWith("https://");
      return {
        id: d.id as string,
        gigId: d.gig_id as string,
        fileName: isUrl ? `v${d.version as number} draft` : (path.split("/").pop() ?? "deliverable.mp4"),
        url: isUrl ? path : undefined,
        version: d.version as number,
        watermarked: d.watermarked as boolean,
        submittedAt: d.submitted_at as string,
        sizeMb: 0,
      };
    });
    transactions = (txRows ?? []).map((t) => ({
      id: t.id as string,
      gigId: t.gig_id as string,
      type: t.type as Transaction["type"],
      amountCents: t.amount_cents as number,
      stripeRef: (t.stripe_ref as string) ?? "",
      createdAt: t.created_at as string,
    }));
  }

  // Reviews are publicly readable (RLS: using (true)) — fetch all so Discover
  // ratings reflect the full platform, not just the current user's gigs.
  const { data: reviewRows } = await sb.from("reviews").select("*");
  const reviews: Review[] = (reviewRows ?? []).map((r) => ({
    id: r.id as string,
    gigId: r.gig_id as string,
    authorId: r.author_id as string,
    targetId: r.target_id as string,
    rating: r.rating as number,
    tags: (r.tags as string[]) ?? [],
    body: (r.body as string) ?? "",
    createdAt: r.created_at as string,
  }));

  // counterparty profiles (creators on my gigs, plus me if creator)
  const counterpartIds = Array.from(new Set(gigs.flatMap((g) => [g.creatorId, g.companyId])));
  let creators: Creator[] = [];
  if (counterpartIds.length) {
    const [{ data: profiles }, { data: details }, { data: platforms }] = await Promise.all([
      sb.from("profiles").select("*").in("id", counterpartIds).eq("role", "creator"),
      sb.from("creator_details").select("*").in("profile_id", counterpartIds),
      sb.from("creator_platforms").select("*").in("creator_id", counterpartIds),
    ]);
    creators = ((profiles as ProfileRow[] | null) ?? []).map((p) =>
      mapCreator(
        p,
        (details as DetailsRow[] | null)?.find((d) => d.profile_id === p.id),
        ((platforms as PlatformRow[] | null) ?? []).filter((x) => x.creator_id === p.id),
      ),
    );
  }

  return { gigs, messages, contracts, deliverables, transactions, reviews, creators };
  } catch {
    return null;
  }
}

/** Fetch a single creator by Loop tag or handle — used by the public profile page. */
export async function fetchCreatorByHandle(handleOrTag: string): Promise<Creator | null> {
  const sb = supabase();
  const [{ data: byTag }, { data: byHandle }] = await Promise.all([
    sb.from("profiles").select("*").eq("loop_tag", handleOrTag).eq("role", "creator").maybeSingle(),
    sb.from("profiles").select("*").eq("handle", handleOrTag).eq("role", "creator").maybeSingle(),
  ]);
  const profile = (byTag ?? byHandle) as ProfileRow | null;
  if (!profile) return null;
  const [{ data: details }, { data: platforms }] = await Promise.all([
    sb.from("creator_details").select("*").eq("profile_id", profile.id).maybeSingle(),
    sb.from("creator_platforms").select("*").eq("creator_id", profile.id),
  ]);
  return mapCreator(profile, details as DetailsRow | null, (platforms as PlatformRow[] | null) ?? []);
}

/** Company profile names for chat headers. */
export async function fetchProfileNames(ids: string[]) {
  if (!ids.length) return {};
  const sb = supabase();
  const { data } = await sb.from("profiles").select("id, name, avatar_hue").in("id", ids);
  const out: Record<string, { name: string; hue: number }> = {};
  for (const row of data ?? []) out[row.id] = { name: row.name ?? "Brand", hue: row.avatar_hue ?? 285 };
  return out;
}

/* ---------- mutators (no-ops without a live auth session) ---------- */

async function authedId(): Promise<string | null> {
  const { data } = await supabase().auth.getUser();
  return data.user?.id ?? null;
}

/** Authorization header carrying the caller's access token for money routes. */
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  return {
    "content-type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface MoneyResult {
  ok: boolean;
  error?: string;
  alreadyDone?: boolean;
}

async function postMoney(path: string, body: Record<string, unknown>): Promise<MoneyResult> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; alreadyDone?: boolean };
    return { ok: res.ok, error: data.error, alreadyDone: data.alreadyDone };
  } catch {
    return { ok: false, error: "Network error" };
  }
}

/** Brand funds a gig's escrow (server verifies payment + records it durably). */
export function dbFundEscrow(p: { gigId: string; sessionId?: string | null }): Promise<MoneyResult> {
  return postMoney("/api/gigs/fund", { gigId: p.gigId, sessionId: p.sessionId ?? undefined });
}

/** Brand approves work → server releases escrow to the creator. */
export function dbReleaseFunds(gigId: string): Promise<MoneyResult> {
  return postMoney("/api/gigs/approve", { gigId });
}

/** Cancel a gig → server refunds the brand per the stage-based policy. */
export function dbCancelGig(gigId: string): Promise<MoneyResult> {
  return postMoney("/api/gigs/cancel", { gigId });
}

/** Company opens a workspace with a creator. Returns the created gig. */
export async function dbCreateGig(creatorId: string, creatorName: string): Promise<Gig | null> {
  const sb = supabase();
  const uid = await authedId();
  if (!uid) return null;
  const { data, error } = await sb
    .from("gigs")
    .insert({
      company_id: uid,
      creator_id: creatorId,
      status: "DRAFT",
      title: `Collab with ${creatorName}`,
      brief: "",
      price_cents: 0,
      fee_cents: 0,
    })
    .select("*")
    .single();
  if (error) return null;
  return mapGig(data as GigRow);
}

export async function dbSendMessage(m: Message): Promise<Message | null> {
  const uid = await authedId();
  if (!uid) return null;
  const { data, error } = await supabase()
    .from("messages")
    .insert({
      id: m.id,
      gig_id: m.gigId,
      sender_id: m.senderId,
      kind: m.kind,
      body: {
        ...(m.text ? { text: m.text } : {}),
        ...(m.attachmentName ? { attachmentName: m.attachmentName } : {}),
        ...(m.offer ? { offer: m.offer } : {}),
      },
    })
    .select("*")
    .single();
  if (error) return null;
  return mapMessage(data as MessageRow);
}

export async function dbUpdateOfferState(messageId: string, offer: OfferBody) {
  const uid = await authedId();
  if (!uid) return;
  await supabase().from("messages").update({ body: { offer } }).eq("id", messageId);
}

export async function dbUpdateGig(gigId: string, patch: Partial<Gig> & { status?: GigStatus }) {
  const uid = await authedId();
  if (!uid) return;
  const row: Record<string, unknown> = {};
  if (patch.status) row.status = patch.status;
  if (patch.priceCents !== undefined) {
    row.price_cents = patch.priceCents;
    row.fee_cents = platformFeeCents(patch.priceCents);
  }
  if (patch.usageExpiresAt !== undefined) row.usage_expires_at = patch.usageExpiresAt;
  if (patch.trackingNumber !== undefined) row.tracking_number = patch.trackingNumber;
  if (patch.deliveredAt !== undefined) row.delivered_at = patch.deliveredAt;
  if (patch.revisionCount !== undefined) row.revision_count = patch.revisionCount;
  if (patch.usageDays !== undefined) row.usage_days = patch.usageDays;
  if (patch.rawFootage !== undefined) row.raw_footage = patch.rawFootage;
  if (patch.platform !== undefined) row.platform = patch.platform;
  if (patch.minPostLifetimeDays !== undefined) row.min_post_lifetime_days = patch.minPostLifetimeDays;
  if (patch.revisionRounds !== undefined) row.revision_rounds = patch.revisionRounds;
  if (patch.videoLengthSeconds !== undefined) row.video_length_seconds = patch.videoLengthSeconds;
  if (patch.publishedUrl !== undefined) row.published_url = patch.publishedUrl;
  if (patch.publishedAt !== undefined) row.published_at = patch.publishedAt;
  if (patch.completedAt !== undefined) row.completed_at = patch.completedAt;
  if (Object.keys(row).length === 0) return;
  await supabase().from("gigs").update(row).eq("id", gigId);
}

/** Insert a new gig (e.g. a DRAFT started from inside a chat). */
export async function dbInsertGig(g: Gig): Promise<Gig | null> {
  const uid = await authedId();
  if (!uid) return null;
  const { data, error } = await supabase()
    .from("gigs")
    .insert({
      company_id: g.companyId,
      creator_id: g.creatorId,
      status: g.status,
      title: g.title,
      brief: g.brief,
      platform: g.platform,
      price_cents: g.priceCents,
      fee_cents: g.feeCents,
      usage_days: g.usageDays,
      raw_footage: g.rawFootage,
      physical_product: g.physicalProduct,
      min_post_lifetime_days: g.minPostLifetimeDays ?? 30,
      revision_rounds: g.revisionRounds ?? 2,
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return mapGig(data as GigRow);
}

export async function dbInsertContract(gigId: string, terms: object) {
  const uid = await authedId();
  if (!uid) return;
  const now = new Date().toISOString();
  await supabase()
    .from("contracts")
    .upsert({ gig_id: gigId, terms, company_signed_at: now, creator_signed_at: now });
}

export async function dbInsertReview(r: Omit<Review, "createdAt">) {
  const uid = await authedId();
  if (!uid) return;
  await supabase()
    .from("reviews")
    .upsert({
      id: r.id,
      gig_id: r.gigId,
      author_id: r.authorId,
      target_id: r.targetId,
      rating: r.rating,
      tags: r.tags,
      body: r.body,
    });
}

export async function dbInsertDeliverable(d: { gigId: string; fileName: string; version: number }) {
  const uid = await authedId();
  if (!uid) return;
  await supabase().from("deliverables").insert({
    gig_id: d.gigId,
    storage_path: `deliverables/${d.gigId}/${d.fileName}`,
    version: d.version,
    watermarked: true,
  });
}

export async function dbUpsertCreatorDetails(p: {
  bio?: string;
  status?: string;
  niches?: string[];
  baseRateCents?: number;
  capacityPerWeek?: number;
  compensationPref?: string;
}) {
  const sb = supabase();
  const uid = await authedId();
  if (!uid) return;
  if (p.bio !== undefined || p.status !== undefined) {
    await sb
      .from("profiles")
      .update({ ...(p.bio !== undefined ? { bio: p.bio } : {}), ...(p.status ? { status: p.status } : {}) })
      .eq("id", uid);
  }
  const details: Record<string, unknown> = { profile_id: uid };
  if (p.niches) details.niches = p.niches;
  if (p.baseRateCents !== undefined) details.base_rate_cents = p.baseRateCents;
  if (p.capacityPerWeek !== undefined) details.capacity_per_week = p.capacityPerWeek;
  if (p.compensationPref) details.compensation_pref = p.compensationPref;
  if (Object.keys(details).length > 1) await sb.from("creator_details").upsert(details);
}

/** Live chat: subscribe to new messages + gig changes for one gig. Returns unsubscribe. */
export function subscribeToGig(
  gigId: string,
  onMessage: (m: Message) => void,
  onGig: (g: Gig) => void,
) {
  const sb = supabase();
  const channel = sb
    .channel(`gig-${gigId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `gig_id=eq.${gigId}` },
      (payload) => onMessage(mapMessage(payload.new as MessageRow)),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages", filter: `gig_id=eq.${gigId}` },
      (payload) => onMessage(mapMessage(payload.new as MessageRow)),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "gigs", filter: `id=eq.${gigId}` },
      (payload) => onGig(mapGig(payload.new as GigRow)),
    )
    .subscribe();
  return () => {
    void sb.removeChannel(channel);
  };
}
