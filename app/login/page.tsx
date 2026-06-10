"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { z } from "zod";
import { logInWithEmail } from "@/lib/auth";
import { TypeOnce } from "@/components/shared/typewriter";

const schema = z.object({ email: z.string().email("real email please"), password: z.string().min(6, "at least 6 characters") });

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    const r = schema.safeParse({ email, password });
    if (!r.success) {
      setError(r.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const { onboarded } = await logInWithEmail(email, password);
      router.push(onboarded ? "/dashboard" : "/onboarding/creator");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink text-[#faf6ef]">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="font-serif text-xl font-extrabold text-[#f2a3df]">MCC®</Link>
        <Link href="/signup" className="rounded-full border-2 border-[#faf6ef]/30 px-4 py-1.5 text-sm font-bold transition-colors hover:border-[#a8d98a] hover:text-[#a8d98a]">
          Sign up
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-xl">
          <h1 className="font-serif min-h-[1.2em] text-4xl font-extrabold sm:text-6xl">
            <TypeOnce text="Welcome back." speed={40} />
          </h1>
          <p className="mt-3 font-medium text-[#faf6ef]/50">Log in and get back to the money.</p>

          <div className="mt-10 space-y-7">
            <div>
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-[#faf6ef]/40">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                autoFocus
                placeholder="you@studio.com"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="mt-2 w-full border-b-4 border-[#faf6ef]/20 bg-transparent pb-2 font-serif text-2xl font-bold text-[#a8d98a] placeholder:text-[#faf6ef]/15 focus:border-[#f2a3df] focus:outline-none sm:text-3xl"
                style={{ boxShadow: "none", borderRadius: 0 }}
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-[#faf6ef]/40">Password</label>
                <Link href="/reset-password" className="text-xs font-bold text-[#f2a3df] underline underline-offset-4">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="mt-2 w-full border-b-4 border-[#faf6ef]/20 bg-transparent pb-2 font-serif text-2xl font-bold text-[#a8d98a] placeholder:text-[#faf6ef]/15 focus:border-[#f2a3df] focus:outline-none sm:text-3xl"
                style={{ boxShadow: "none", borderRadius: 0 }}
              />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-sm font-bold text-[#f2a3df]">
                ↳ {error}
              </motion.p>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={submit}
                disabled={busy}
                className="flex items-center gap-2 rounded-full bg-[#f2a3df] px-8 py-4 font-serif text-lg font-bold text-ink disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                Log in
              </motion.button>
              <span className="hidden text-xs font-bold uppercase tracking-widest text-[#faf6ef]/30 sm:block">press Enter ↵</span>
            </div>
          </div>
        </div>
      </main>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-10 top-1/3 h-32 w-32 animate-float rounded-[40%_60%_55%_45%/55%_45%_60%_40%] bg-[#f2a3df]/15" />
        <div className="absolute -right-8 bottom-1/4 h-40 w-40 animate-float rounded-[60%_40%_45%_55%/45%_55%_40%_60%] bg-[#a8d98a]/15 [animation-delay:1s]" />
      </div>
    </div>
  );
}
