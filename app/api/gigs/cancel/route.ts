import { NextResponse } from "next/server";
import { authedUserId } from "@/lib/supabase-admin";
import { recordRefund } from "@/lib/ledger";

/**
 * Cancel a gig and refund the brand per the stage-based refund policy.
 * Either party to the gig may cancel; the refund amount is computed server-side.
 */
export async function POST(req: Request) {
  const callerId = await authedUserId(req);
  if (!callerId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { gigId?: string } | null;
  if (!body?.gigId) return NextResponse.json({ error: "gigId required" }, { status: 400 });

  const result = await recordRefund({ gigId: body.gigId, callerId });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, refund: result.refund ?? 0, alreadyDone: result.alreadyDone ?? false });
}
