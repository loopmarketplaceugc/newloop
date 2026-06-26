"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Check, Clapperboard, Loader2, Mail } from "lucide-react";
import { z } from "zod";
import { signUpWithEmail } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { haptics } from "@/lib/haptics";
import { toast } from "@/components/ui/toast";
import { TypeOnce } from "@/components/shared/typewriter";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

const schema = z.object({
  email: z.string().email("real email please — payouts depend on it"),
  password: z.string().min(8, "8+ characters keeps the bots out"),
});

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<Role>("creator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const accountExists = /already an account/i.test(error ?? "");

  useEffect(() => {
    const r = params.get("role");
    if (r === "creator" || r === "company") setRole(r);
  }, [params]);

  const submit = async () => {
    setError(null);
    const r = schema.safeParse({ email, password });
    if (!r.success) {
      haptics.error();
      setError(r.error.issues[0].message);
      return;
    }
    setBusy(true);
    haptics.step();
    try {
      const result = await signUpWithEmail(email, password, role);
      haptics.success();
      if (result.needsVerification) {
        setSent(true);
      } else {
        router.push(role === "creator" ? "/onboarding/creator" : "/onboarding/company");
      }
    } catch (e) {
      haptics.error();
      setError(e instanceof Error ? e.message : "Signup failed");
      setBusy(false);
    }
  };

  const resend = async () => {
    setResendBusy(true);
    setResendMsg(null);
    try {
      await supabase().auth.resend({ type: "signup", email });
      setResendMsg("Sent! Check your inbox again.");
    } catch {
      setResendMsg("Couldn't resend — try again in a moment.");
    } finally {
      setResendBusy(false);
    }
  };

  if (sent) {
    return (
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#a8d98a]/20">
            <Mail className="h-8 w-8 text-[#a8d98a]" />
          </div>
          <h1 className="font-serif mt-6 text-4xl font-extrabold sm:text-5xl">
            Check your inbox.
          </h1>
          <p className="mt-4 text-lg font-bold text-[#faf6ef]/60">
            We sent a confirmation link to{" "}
            <span className="font-mono text-[#a8d98a]">{email}</span>.
          </p>
          <p className="mt-2 text-sm font-bold text-[#faf6ef]/40">
            Click the link in that email to activate your Loop account and get started.
            Check your spam folder if you don&apos;t see it within a minute.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resend}
              disabled={resendBusy}
              className="flex items-center gap-2 rounded-full border-2 border-[#faf6ef]/20 px-6 py-3 text-sm font-bold text-[#faf6ef]/70 hover:border-[#a8d98a]/50 hover:text-[#a8d98a] disabled:opacity-40 cursor-pointer transition-colors"
            >
              {resendBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Resend email
            </motion.button>
            <Link href="/login" className="text-sm font-bold text-[#f2a3df] underline underline-offset-4">
              Already verified? Log in
            </Link>
          </div>

          {resendMsg && (
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-4 text-sm font-bold text-[#a8d98a]"
            >
              {resendMsg}
            </motion.p>
          )}
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24">
      <div className="w-full max-w-xl">
        <h1 className="font-serif min-h-[1.2em] text-4xl font-extrabold sm:text-6xl">
          <TypeOnce text="Pick your side." speed={40} className="text-gradient" caret={false} />
        </h1>
        <p className="mt-3 font-medium text-[#faf6ef]/50">
          Creator sign up unlocks paid job listings. Brand sign up lets you hire creators.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(
            [
              { value: "creator" as Role, icon: Clapperboard, title: "Creator", body: "See briefs, scripts, pay, and bonuses.", tint: "#a8d98a" },
              { value: "company" as Role, icon: Building2, title: "Brand", body: "Post offers and pay through Stripe.", tint: "#f2a3df" },
            ]
          ).map((opt, i) => {
            const on = role === opt.value;
            return (
              <motion.button
                key={opt.value}
                whileHover={{ scale: 1.04, rotate: i % 2 ? 1.5 : -1.5 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  haptics.select();
                  setRole(opt.value);
                }}
                className={cn(
                  "relative rounded-[24px] border-[3px] p-6 text-left transition-colors cursor-pointer",
                  on ? "border-transparent text-ink" : "border-[#faf6ef]/20 text-[#faf6ef] hover:border-[#faf6ef]/50",
                )}
                style={on ? { background: opt.tint } : undefined}
              >
                {on && (
                  <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[#a8d98a]">
                    <Check className="h-4 w-4" />
                  </span>
                )}
                <opt.icon className="h-8 w-8" />
                <p className="font-serif mt-3 text-2xl font-extrabold">{opt.title}</p>
                <p className="mt-1 text-sm font-bold opacity-70">{opt.body}</p>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6 rounded-[20px] border-2 border-[#faf6ef]/15 bg-[#faf6ef]/[0.04] p-4">
          <p className="text-sm font-bold leading-relaxed text-[#faf6ef]/70">
            {role === "creator"
              ? "You will land in creator onboarding, then your dashboard shows paid opportunities with deliverables, platform, script direction, base pay, and view bonuses."
              : "You will land in brand onboarding, then you can browse creators, send offer cards, and pay creators through Loop."}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-[#faf6ef]/40">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              placeholder={role === "creator" ? "you@studio.com" : "you@brand.com"}
              onChange={(e) => {
                haptics.tap();
                setEmail(e.target.value);
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="mt-2 w-full border-b-4 border-[#faf6ef]/20 bg-transparent pb-2 font-serif text-2xl font-bold text-[#a8d98a] placeholder:text-[#faf6ef]/15 focus:border-[#f2a3df] focus:outline-none sm:text-3xl"
              style={{ boxShadow: "none", borderRadius: 0 }}
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-[#faf6ef]/40">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              placeholder="8+ characters"
              onChange={(e) => {
                haptics.tap();
                setPassword(e.target.value);
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="mt-2 w-full border-b-4 border-[#faf6ef]/20 bg-transparent pb-2 font-serif text-2xl font-bold text-[#a8d98a] placeholder:text-[#faf6ef]/15 focus:border-[#f2a3df] focus:outline-none sm:text-3xl"
              style={{ boxShadow: "none", borderRadius: 0 }}
            />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
              <p className="text-sm font-bold text-[#f2a3df]">↳ {error}</p>
              {accountExists && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/login" className="rounded-full bg-[#f2a3df] px-4 py-2 text-sm font-bold text-ink">
                    Log in
                  </Link>
                  <Link href="/reset-password" className="rounded-full border-2 border-[#a8d98a]/50 px-4 py-2 text-sm font-bold text-[#a8d98a]">
                    Reset password
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={submit}
              disabled={busy}
              className="flex items-center gap-2 rounded-full bg-[#a8d98a] px-8 py-4 font-serif text-lg font-bold text-ink disabled:opacity-50 cursor-pointer"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              {role === "creator" ? "Create creator account" : "Create brand account"}
            </motion.button>
            <span className="text-sm font-bold text-[#faf6ef]/40">
              Have one?{" "}
              <Link href="/login" className="text-[#f2a3df] underline underline-offset-4">Log in</Link>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-ink text-[#faf6ef]">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="font-serif text-xl font-extrabold text-[#f2a3df]">Loop®</Link>
      </header>
      <Suspense fallback={null}>
        <SignupInner />
      </Suspense>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-10 top-1/3 h-32 w-32 animate-float rounded-[40%_60%_55%_45%/55%_45%_60%_40%] bg-[#f2a3df]/15" />
        <div className="absolute -right-8 bottom-1/4 h-40 w-40 animate-float rounded-[60%_40%_45%_55%/45%_55%_40%_60%] bg-[#a8d98a]/15 [animation-delay:1s]" />
      </div>
    </div>
  );
}
