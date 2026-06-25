import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://vqbykppxpplctrrrpomg.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}

type AnyRow = Record<string, unknown>;

/** Attach a human brand_name (company_name → profile name) to each request row. */
async function withBrandNames(client: ReturnType<typeof sb>, rows: AnyRow[]) {
  const companyIds = [...new Set(rows.map((r) => r.company_id).filter(Boolean))] as string[];
  if (companyIds.length === 0) return rows;

  const [{ data: companies }, { data: profiles }] = await Promise.all([
    client.from("companies").select("profile_id, company_name").in("profile_id", companyIds),
    client.from("profiles").select("id, name").in("id", companyIds),
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
  const client = sb();

  if (id) {
    const { data, error } = await client.from("requests").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    const [withName] = await withBrandNames(client, [data as AnyRow]);
    return NextResponse.json({ request: withName });
  }

  let query = client.from("requests").select("*").order("created_at", { ascending: false });
  if (companyId) {
    query = query.eq("company_id", companyId);
  } else {
    query = query.eq("status", "open");
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const requests = await withBrandNames(client, (data ?? []) as AnyRow[]);
  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const client = sb();
  const { data, error } = await client.from("requests").insert([{
    company_id: body.companyId,
    title: body.title,
    description: body.description,
    platforms: body.platforms ?? [],
    num_creators: body.numCreators ?? 1,
    reels_per_creator: body.reelsPerCreator ?? 1,
    pay_per_creator_cents: Math.round(((body.payPerCreator as number) ?? 0) * 100),
    deadline_at: body.deadlineAt ?? null,
    merch_included: body.merchIncluded ?? false,
    merch_description: body.merchDescription ?? null,
    status: "open",
  }]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ request: data });
}
