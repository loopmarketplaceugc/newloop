import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/supabase-admin";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["creator", "company"]),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, role } = parsed.data;

  // Use auth_email_exists — an O(1) DB lookup — instead of listing all users.
  const { data: rows, error: lookupErr } = await admin()
    .rpc("auth_email_exists", { p_email: email });

  if (lookupErr) {
    // RPC unavailable (e.g. migration not yet run) — allow signup and let
    // Supabase handle the duplicate check itself.
    return NextResponse.json({ ok: true });
  }

  const existing = (rows as Array<{ user_id: string; user_meta: Record<string, unknown> }> | null)?.[0] ?? null;
  if (!existing) {
    return NextResponse.json({ ok: true });
  }

  const existingRole = (existing.user_meta?.role as string | undefined) ?? null;

  // Use an identical message regardless of role to prevent account enumeration.
  if (existingRole && existingRole !== role) {
    return NextResponse.json(
      { error: "There is already an account with this email. Log in instead, or reset your password." },
      { status: 409 },
    );
  }

  return NextResponse.json(
    { error: "There is already an account with this email. Log in instead, or reset your password." },
    { status: 409 },
  );
}
