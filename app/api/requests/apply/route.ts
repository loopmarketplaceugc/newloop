import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://vqbykppxpplctrrrpomg.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
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
