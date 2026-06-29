import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { admin } from "@/lib/supabase-admin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["creator", "company"]),
  origin: z.string().url().optional(),
});

export async function POST(req: Request) {
  const rl = rateLimit(`signup:${clientIp(req)}`, 10, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, password, role, origin } = parsed.data;

  // Check for existing account
  const { data: rows, error: lookupErr } = await admin()
    .rpc("auth_email_exists", { p_email: email });

  if (!lookupErr) {
    const existing = (rows as Array<{ user_id: string; user_meta: Record<string, unknown> }> | null)?.[0] ?? null;
    if (existing) {
      return NextResponse.json(
        { error: "There is already an account with this email. Log in instead, or reset your password." },
        { status: 409 },
      );
    }
  }

  // Call auth.signUp server-side so errors are visible in logs
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.error("[signup] Supabase env vars not configured");
    return NextResponse.json({ error: "Service not configured." }, { status: 503 });
  }

  const sb = createClient(url, anonKey, { auth: { persistSession: false } });
  const redirectTo = origin ? `${origin}/auth/callback` : undefined;

  const { data, error: signupError } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { role },
      ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
    },
  });

  if (signupError) {
    console.error("[signup] Supabase error:", {
      message: signupError.message,
      status: (signupError as { status?: number }).status,
      code: (signupError as { code?: string }).code,
    });
    if (/already registered|user already exists/i.test(signupError.message)) {
      return NextResponse.json(
        { error: "There is already an account with this email. Log in instead, or reset your password." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: signupError.message || "Signup failed — please try again." },
      { status: 400 },
    );
  }

  const needsVerification = !(data.session && data.user);

  if (!needsVerification && data.session && data.user) {
    return NextResponse.json({
      ok: true,
      needsVerification: false,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user_id: data.user.id,
      },
    });
  }

  return NextResponse.json({ ok: true, needsVerification: true });
}
