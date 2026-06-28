import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const creatorId = url.searchParams.get("creatorId");
  const requestId = url.searchParams.get("requestId");
  const companyId = url.searchParams.get("companyId");
  const client = sb();

  if (creatorId) {
    const { data, error } = await client
      .from("request_applications")
      .select("request_id, status, applied_at")
      .eq("creator_id", creatorId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ applications: data ?? [] });
  }

  if (requestId) {
    const { data: apps, error } = await client
      .from("request_applications")
      .select("id, creator_id, note, status, applied_at")
      .eq("request_id", requestId)
      .order("applied_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!apps || apps.length === 0) return NextResponse.json({ applications: [] });

    const ids = apps.map((a) => a.creator_id as string);
    const [{ data: profiles }, { data: details }] = await Promise.all([
      client.from("profiles").select("id, name, handle, avatar_hue, bio").in("id", ids),
      client.from("creator_details").select("profile_id, niches, tier").in("profile_id", ids),
    ]);

    const byId = new Map((profiles ?? []).map((p) => [p.id as string, p]));
    const detById = new Map((details ?? []).map((d) => [d.profile_id as string, d]));

    const enriched = apps.map((a) => ({
      id: a.id,
      creator_id: a.creator_id,
      note: a.note,
      status: a.status,
      applied_at: a.applied_at,
      profile: byId.get(a.creator_id as string) ?? null,
      creator_details: detById.get(a.creator_id as string) ?? null,
    }));

    return NextResponse.json({ applications: enriched });
  }

  // Company view: return pending application counts per request
  if (companyId) {
    const { data: reqs } = await client
      .from("requests")
      .select("id")
      .eq("company_id", companyId);

    const requestIds = (reqs ?? []).map((r) => r.id as string);
    if (requestIds.length === 0) return NextResponse.json({ counts: {} });

    const { data: apps } = await client
      .from("request_applications")
      .select("request_id, status")
      .in("request_id", requestIds)
      .eq("status", "pending");

    const counts: Record<string, number> = {};
    for (const app of apps ?? []) {
      const rid = app.request_id as string;
      counts[rid] = (counts[rid] ?? 0) + 1;
    }
    return NextResponse.json({ counts });
  }

  return NextResponse.json({ error: "creatorId, requestId, or companyId required" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body?.applicationId || !body?.action) {
    return NextResponse.json({ error: "applicationId and action required" }, { status: 400 });
  }
  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const client = sb();

  const { data: app, error: appErr } = await client
    .from("request_applications")
    .select("id, request_id, creator_id, status")
    .eq("id", body.applicationId as string)
    .single();

  if (appErr || !app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  if ((app.status as string) !== "pending") {
    return NextResponse.json({ error: "Application already actioned" }, { status: 400 });
  }

  const newStatus = body.action === "approve" ? "accepted" : "rejected";

  const { error: updateErr } = await client
    .from("request_applications")
    .update({ status: newStatus })
    .eq("id", body.applicationId as string);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

  if (body.action === "reject") {
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  // Approve: fetch request details and create a gig
  const { data: request, error: reqErr } = await client
    .from("requests")
    .select("*")
    .eq("id", app.request_id as string)
    .single();

  if (reqErr || !request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const priceCents = request.pay_per_creator_cents as number;
  const feeCents = Math.round(priceCents * 0.1);
  const platforms = (request.platforms as string[]) ?? [];

  const { data: gig, error: gigErr } = await client
    .from("gigs")
    .insert([{
      company_id: request.company_id,
      creator_id: app.creator_id,
      status: "OFFER_ACCEPTED",
      title: request.title,
      brief: request.description ?? "",
      platform: platforms[0] ?? "tiktok",
      price_cents: priceCents,
      fee_cents: feeCents,
      usage_days: 90,
      raw_footage: false,
      deadline: request.deadline_at ?? null,
      min_post_lifetime_days: 30,
      revision_rounds: 2,
    }])
    .select()
    .single();

  if (gigErr) return NextResponse.json({ error: gigErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, status: "accepted", gigId: (gig as Record<string, unknown>).id });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body?.requestId || !body?.creatorId) {
    return NextResponse.json({ error: "requestId and creatorId required" }, { status: 400 });
  }
  const client = sb();
  const { error: appErr } = await client.from("request_applications").upsert([{
    request_id: body.requestId,
    creator_id: body.creatorId,
    note: body.note ?? null,
  }], { onConflict: "request_id,creator_id" });
  if (appErr) return NextResponse.json({ error: appErr.message }, { status: 400 });
  const { data: reqData } = await client.from("requests").select("title, company_id").eq("id", body.requestId).single();
  const { data: creatorData } = await client.from("profiles").select("name").eq("id", body.creatorId).single();
  return NextResponse.json({
    ok: true,
    requestTitle: reqData?.title,
    creatorName: creatorData?.name,
  });
}
