import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://vqbykppxpplctrrrpomg.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const creatorId = url.searchParams.get("creatorId");
  const requestId = url.searchParams.get("requestId");
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
      client.from("profiles").select("id, name, handle, avatar_hue").in("id", ids),
      client.from("creator_details").select("profile_id, bio, niches, tier, status").in("profile_id", ids),
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

  return NextResponse.json({ error: "creatorId or requestId required" }, { status: 400 });
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
