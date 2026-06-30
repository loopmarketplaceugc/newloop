import { NextResponse } from "next/server";
import { authedUserId } from "@/lib/supabase-admin";
import { releaseFunds } from "@/lib/ledger";

/**
 * Brand approves delivered work → release held funds to the creator.
 * Caller identity comes from their verified JWT, never the body, so a creator
 * cannot approve (and pay out) their own gig.
 */
export async function POST(req: Request) {
  const callerId = await authedUserId(req);
  if (!callerId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { gigId?: string } | null;
  if (!body?.gigId) return NextResponse.json({ error: "gigId required" }, { status: 400 });

  const result = await releaseFunds({ gigId: body.gigId, callerId });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, payout: result.payout ?? null, alreadyDone: result.alreadyDone ?? false });
}
