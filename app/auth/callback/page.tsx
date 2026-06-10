"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { completeAuthFromSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { TypeOnce } from "@/components/shared/typewriter";

type Phase = "working" | "error";

/** Lands here from the Supabase confirmation email — finishes login and routes onward. */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("working");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const run = async () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const search = new URLSearchParams(window.location.search);

      // Expired / invalid link from the email
      const errDesc = hash.get("error_description") ?? search.get("error_description");
      if (errDesc) {
        setErrMsg(errDesc.replace(/\+/g, " "));
        setPhase("error");
        return;
      }

      const sb = supabase();

      // PKCE flow (?code=...) — exchange for a session
      const code = search.get("code");
      if (code) {
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) {
          setErrMsg(error.message);
          setPhase("error");
          return;
        }
      }

      // Implicit flow (#access_token=...) — set the session explicitly
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await sb.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setErrMsg(error.message);
          setPhase("error");
          return;
        }
      }

      const result = await completeAuthFromSession();
      if (!result) {
        setErrMsg("No session found — the link may have already been used.");
        setPhase("error");
        return;
      }
      router.replace(
        result.onboarded
          ? "/dashboard"
          : result.role === "company"
            ? "/onboarding/company"
            : "/onboarding/creator",
      );
    };
    void run();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-ink text-[#faf6ef]">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="font-serif text-xl font-extrabold text-[#f2a3df]">MCC®</Link>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24">
        <div className="w-full max-w-xl text-center">
          {phase === "working" ? (
            <>
              <h1 className="font-serif text-3xl font-extrabold sm:text-5xl">
                <TypeOnce text="Confirming your email…" speed={35} />
              </h1>
              <p className="mt-4 font-medium text-[#faf6ef]/50">One sec — unlocking your account.</p>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-serif text-3xl font-extrabold text-[#f2a3df] sm:text-5xl">
                That link didn&apos;t work.
              </h1>
              <p className="mt-4 font-medium text-[#faf6ef]/60">{errMsg}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/login" className="rounded-full bg-[#a8d98a] px-7 py-3.5 font-serif text-lg font-bold text-ink transition-transform hover:scale-105">
                  Try logging in
                </Link>
                <Link href="/signup" className="rounded-full border-2 border-[#faf6ef]/30 px-7 py-3.5 font-serif text-lg font-bold transition-colors hover:border-[#f2a3df] hover:text-[#f2a3df]">
                  Sign up again
                </Link>
              </div>
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
