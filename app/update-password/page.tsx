"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { z } from "zod";
import { updatePassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { TypeOnce } from "@/components/shared/typewriter";

type Phase = "checking" | "ready" | "done" | "error";

const schema = z
  .object({
    password: z.string().min(8, "8+ characters please"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "passwords need to match",
    path: ["confirm"],
  });

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const search = new URLSearchParams(window.location.search);
      const errDesc = hash.get("error_description") ?? search.get("error_description");
      if (errDesc) {
        setError(errDesc.replace(/\+/g, " "));
        setPhase("error");
        return;
      }

      const sb = supabase();
      const code = search.get("code");
      if (code) {
        const { error: exchangeError } = await sb.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          setPhase("error");
          return;
        }
      }

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error: sessionError } = await sb.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          setError(sessionError.message);
          setPhase("error");
          return;
        }
      }

      const { data } = await sb.auth.getUser();
      if (!data.user) {
        setError("No reset session found. Request a fresh password link.");
        setPhase("error");
        return;
      }

      setPhase("ready");
      window.history.replaceState(null, "", "/update-password");
    };

    void run();
  }, []);

  const submit = async () => {
    setError(null);
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      setPhase("done");
      await supabase().auth.signOut();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink text-[#faf6ef]">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="font-serif text-xl font-extrabold text-[#f2a3df]">
          MCC®
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-xl">
          {phase === "checking" && (
            <>
              <h1 className="font-serif text-4xl font-extrabold sm:text-6xl">
                <TypeOnce text="Opening reset link…" speed={40} />
              </h1>
              <p className="mt-3 font-medium text-[#faf6ef]/50">One sec — checking the recovery token.</p>
            </>
          )}

          {phase === "ready" && (
            <>
              <h1 className="font-serif min-h-[1.2em] text-4xl font-extrabold sm:text-6xl">
                <TypeOnce text="New password." speed={40} />
              </h1>
              <p className="mt-3 font-medium text-[#faf6ef]/50">Pick something you won’t have to reset again tomorrow.</p>

              <div className="mt-10 space-y-7">
                <div>
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-[#faf6ef]/40">
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    autoFocus
                    placeholder="8+ characters"
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    className="mt-2 w-full border-b-4 border-[#faf6ef]/20 bg-transparent pb-2 font-serif text-2xl font-bold text-[#a8d98a] placeholder:text-[#faf6ef]/15 focus:border-[#f2a3df] focus:outline-none sm:text-3xl"
                    style={{ boxShadow: "none", borderRadius: 0 }}
                  />
                </div>
                <div>
                  <label htmlFor="confirm" className="text-xs font-bold uppercase tracking-widest text-[#faf6ef]/40">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    placeholder="same one again"
                    onChange={(e) => setConfirm(e.target.value)}
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

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={submit}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-full bg-[#a8d98a] px-8 py-4 font-serif text-lg font-bold text-ink disabled:opacity-50 cursor-pointer"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                  Save password
                </motion.button>
              </div>
            </>
          )}

          {phase === "done" && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-serif text-4xl font-extrabold text-[#a8d98a] sm:text-6xl">Password saved.</h1>
              <p className="mt-3 font-medium text-[#faf6ef]/50">Log in with the new one.</p>
              <button
                onClick={() => router.replace("/login")}
                className="mt-8 rounded-full bg-[#f2a3df] px-8 py-4 font-serif text-lg font-bold text-ink transition-transform hover:scale-105 cursor-pointer"
              >
                Back to login
              </button>
            </motion.div>
          )}

          {phase === "error" && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-serif text-4xl font-extrabold text-[#f2a3df] sm:text-6xl">Link expired.</h1>
              <p className="mt-3 font-medium text-[#faf6ef]/60">{error}</p>
              <Link
                href="/reset-password"
                className="mt-8 inline-flex rounded-full bg-[#a8d98a] px-8 py-4 font-serif text-lg font-bold text-ink transition-transform hover:scale-105"
              >
                Send a fresh link
              </Link>
            </motion.div>
          )}
        </div>
      </main>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-10 top-1/3 h-32 w-32 animate-float rounded-[40%_60%_55%_45%/55%_45%_60%_40%] bg-[#f2a3df]/15" />
        <div className="absolute -right-8 bottom-1/4 h-40 w-40 animate-float rounded-[60%_40%_45%_55%/45%_55%_40%_60%] bg-[#a8d98a]/15 [animation-delay:1s]" />
      </div>
    </div>
  );
}
