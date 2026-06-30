import { NextResponse } from "next/server";
import { admin, authedUserId } from "@/lib/supabase-admin";

type AnyRow = Record<string, unknown>;

/** Attach a human brand_name (company_name → profile name) to each request row. */
async function withBrandNames(rows: AnyRow[]) {
  const companyIds = [...new Set(rows.map((r) => r.company_id).filter(Boolean))] as string[];
  if (companyIds.length === 0) return rows;

  const [{ data: companies }, { data: profiles }] = await Promise.all([
    admin().from("companies").select("profile_id, company_name").in("profile_id", companyIds),
    admin().from("profiles").select("id, name").in("id", companyIds),
  ]);

  const byId = new Map<string, string>();
  for (const p of profiles ?? []) byId.set(p.id as string, (p.name as string) || "");
  for (const c of companies ?? []) {
    if (c.company_name) byId.set(c.profile_id as string, c.company_name as string);
  }

  return rows.map((r) => ({
    ...r,
    brand_name: byId.get(r.company_id as string) || "Brand",
  }));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");
  const id = url.searchParams.get("id");

  if (id) {
    // Public — any authenticated or unauthenticated viewer can fetch a specific request.
    const { data, error } = await admin().from("requests").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    const [withName] = await withBrandNames([data as AnyRow]);
    return NextResponse.json({ request: withName });
  }

  if (companyId) {
    // Only the company that owns the requests may list them.
    const callerId = await authedUserId(req);
    if (!callerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (callerId !== companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let query = admin().from("requests").select("*").order("created_at", { ascending: false });
  if (companyId) {
    query = query.eq("company_id", companyId);
  } else {
    query = query.eq("status", "open");
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const requests = await withBrandNames((data ?? []) as AnyRow[]);
  return NextResponse.json({ requests });
}

export async function DELETE(req: Request) {
  const callerId = await authedUserId(req);
  if (!callerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: existing } = await admin().from("requests").select("company_id").eq("id", id).single();
  if (!existing || (existing.company_id as string) !== callerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { error } = await admin().from("requests").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const callerId = await authedUserId(req);
  if (!callerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const campaignEnd = (body.campaignEndAt as string | null) ?? (body.deadlineAt as string | null) ?? null;
  const campaignStart = (body.campaignStartAt as string | null) ?? null;

  // Base row uses only columns guaranteed to exist. deadline_at carries the
  // campaign end date so older rows / the gig-creation path keep working.
  const baseRow = {
    company_id: callerId, // always from verified token, never from body
    title: body.title,
    description: body.description,
    platforms: body.platforms ?? [],
    num_creators: Math.max(1, Number(body.numCreators) || 1),
    reels_per_creator: Math.max(1, Number(body.reelsPerCreator) || 1),
    pay_per_creator_cents: Math.round(Math.max(0, Number(body.payPerCreator) || 0) * 100),
    deadline_at: campaignEnd,
    merch_included: body.merchIncluded ?? false,
    merch_description: body.merchDescription ?? null,
    status: "open",
  };
  const withCampaign = { ...baseRow, campaign_start_at: campaignStart, campaign_end_at: campaignEnd };

  // Try with the campaign-range columns; fall back if the migration (00020)
  // hasn't been applied to this database yet.
  let { data, error } = await admin().from("requests").insert([withCampaign]).select().single();
  if (error && /campaign_start_at|campaign_end_at|schema cache|column/i.test(error.message)) {
    ({ data, error } = await admin().from("requests").insert([baseRow]).select().single());
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ request: data });
}
