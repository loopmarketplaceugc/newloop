import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["creator", "company"]),
});

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://nylivxiyzxjdjsbdmrnw.supabase.co";

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, role } = parsed.data;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) {
    // No service role — can't pre-check; let Supabase handle duplicates at signUp
    return NextResponse.json({ ok: true });
  }

  const admin = createClient(SUPABASE_URL, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = listData?.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (!existing) {
    return NextResponse.json({ ok: true });
  }

  const existingRole = (existing.user_metadata?.role as string | undefined) ?? null;

  if (existingRole && existingRole !== role) {
    const existingLabel = existingRole === "creator" ? "creator" : "brand";
    return NextResponse.json(
      {
        error: `This email is already registered as a ${existingLabel} account. You cannot use the same email for both account types.`,
      },
      { status: 409 },
    );
  }

  return NextResponse.json(
    { error: "There is already an account with this email. Log in instead, or reset your password." },
    { status: 409 },
  );
}
