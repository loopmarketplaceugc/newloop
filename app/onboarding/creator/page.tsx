"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Rocket, Sparkles } from "lucide-react";
import { z } from "zod";
import { useSession } from "@/lib/store/session";
import { useApp } from "@/lib/store/app";
import { saveCreatorProfile } from "@/lib/auth";
import { DEMO_CREATOR_ID } from "@/lib/seed";
import { TypeOnce } from "@/components/shared/typewriter";
import { TikTokLogo, InstagramLogo, YouTubeLogo } from "@/components/shared/brand-logos";
import { tierForFollowers, TIER_LABELS, type Platform } from "@/lib/types";
import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

/* One question per screen. Enter to continue. Zero friction. */

const PLATFORMS: { id: Platform; label: string; Logo: typeof TikTokLogo; tint: string }[] = [
  { id: "tiktok", label: "TikTok", Logo: TikTokLogo, tint: "#f2a3df" },
  { id: "reels", label: "Instagram", Logo: InstagramLogo, tint: "#a8d98a" },
  { id: "shorts", label: "YouTube", Logo: YouTubeLogo, tint: "#faf6ef" },
];

const fieldSchemas = {
  firstName: z.string().min(2, "at least 2 letters, promise it's worth it"),
  lastName: z.string().min(2, "your last name too — contracts need it"),
  phone: z.string().regex(/^[+\d][\d\s().-]{6,}$/, "that doesn't look like a phone number"),
  email: z.string().email("that email won't get you paid"),
};

type TextStepId = keyof typeof fieldSchemas;

interface TextStep {
  kind: "text";
  id: TextStepId;
  q: string;
  sub?: string;
  placeholder: string;
  type?: string;
}

type Step =
  | TextStep
  | { kind: "platforms"; q: string; sub: string }
  | { kind: "profile"; q: string; sub: string; platform: Platform }
  | { kind: "done"; q: string; sub: string };

interface PlatformMetrics {
  followerCount: number | null;
  postCount: number | null;
  averageViews: number | null;
  confidence: "high" | "medium" | "low";
  message: string;
}

const emptyLinks: Record<Platform, string> = { tiktok: "", reels: "", shorts: "" };
const emptyFollowers: Record<Platform, string> = { tiktok: "", reels: "", shorts: "" };

function numericInput(value: string) {
  return parseInt(value.replace(/\D/g, "")) || 0;
}

export default function CreatorOnboarding() {
  const router = useRouter();
  const session = useSession();
  const completeOnboarding = useSession((s) => s.completeOnboarding);
  const setName = useSession((s) => s.setName);
  const ensureCreator = useApp((s) => s.ensureCreator);

  const [stepIdx, setStepIdx] = useState(0);
  const [typed, setTyped] = useState(false);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [profileLinks, setProfileLinks] = useState<Record<Platform, string>>(emptyLinks);
  const [followers, setFollowers] = useState<Record<Platform, string>>(emptyFollowers);
  const [metrics, setMetrics] = useState<Partial<Record<Platform, PlatformMetrics>>>({});
  const [analyzing, setAnalyzing] = useState<Platform | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const steps: Step[] = useMemo(
    () => [
      { kind: "text", id: "firstName", q: "First things first — what's your first name?", placeholder: "Mia", sub: "60 seconds. That's all this takes." },
      { kind: "text", id: "lastName", q: `Nice to meet you, ${values.firstName || "you"}. Last name?`, placeholder: "Tanaka", sub: "It goes on your contracts, not your profile." },
      { kind: "text", id: "phone", q: "Best number to reach you?", placeholder: "+1 (555) 010-2030", type: "tel", sub: "Only for gig alerts. Never sold, never spammed." },
      { kind: "text", id: "email", q: "And the email brands should connect with?", placeholder: "mia@studio.com", type: "email", sub: "Payout receipts land here too." },
      {
        kind: "platforms",
        q: "Where do you post?",
        sub: "Tap everything that applies. Followers are context, not a gate — UGC is about quality.",
      },
      ...platforms.map((p) => ({
        kind: "profile" as const,
        platform: p,
        q: `Drop your ${PLATFORMS.find((x) => x.id === p)!.label} link.`,
        sub:
          p === "shorts"
            ? "Paste your channel/profile link, then add followers manually."
            : "We’ll try to pull followers, posts, and average views from the public profile. No fake stats.",
      })),
      { kind: "done", q: `You're in, ${values.firstName || "creator"}.`, sub: "Profile live. Status: Open to Work." },
    ],
    [platforms, values.firstName],
  );

  const step = steps[Math.min(stepIdx, steps.length - 1)];
  const progress = Math.round((stepIdx / (steps.length - 1)) * 100);
  const followerCountFor = (platform: Platform) =>
    metrics[platform]?.followerCount ?? numericInput(followers[platform]);
  const totalFollowers = platforms.reduce((s, p) => s + followerCountFor(p), 0);
  const tier = tierForFollowers(totalFollowers);

  useEffect(() => {
    setTyped(false);
    setError(null);
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [stepIdx]);

  const next = () => {
    setError(null);
    if (step.kind === "text") {
      const r = fieldSchemas[step.id].safeParse(values[step.id].trim());
      if (!r.success) {
        setError(r.error.issues[0].message);
        return;
      }
    }
    if (step.kind === "platforms" && platforms.length === 0) {
      setError("pick at least one — brands filter by platform");
      return;
    }
    if (step.kind === "profile") {
      const link = profileLinks[step.platform].trim();
      const requiresLink = step.platform === "tiktok" || step.platform === "reels";
      if (requiresLink && !link) {
        setError("paste your profile link so brands can verify you");
        return;
      }
      if (link) {
        try {
          new URL(link);
        } catch {
          setError("that link is not a valid URL");
          return;
        }
      }
      if (followerCountFor(step.platform) <= 0) {
        setError("add your followers or run the analyzer first");
        return;
      }
    }
    if (step.kind === "done") {
      const fullName = `${values.firstName} ${values.lastName}`.trim();
      const platformRows = platforms.map((p) => ({
        platform: p,
        url: profileLinks[p].trim(),
        followerCount: followerCountFor(p),
        postCount: metrics[p]?.postCount ?? undefined,
        averageViews: metrics[p]?.averageViews ?? undefined,
      }));
      // Local record (real users start zeroed — no fake numbers) + Supabase profile
      ensureCreator(session.isDemo ? DEMO_CREATOR_ID : (session.userId ?? DEMO_CREATOR_ID), {
        name: fullName || "Creator",
        status: "open",
        tier,
        platforms: platformRows,
      });
      setName(fullName);
      void saveCreatorProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        email: values.email || session.email,
        platforms: platformRows,
      });
      completeOnboarding();
      router.push("/dashboard");
      return;
    }
    setDir(1);
    setStepIdx((i) => i + 1);
  };

  const back = () => {
    if (stepIdx === 0) return;
    setDir(-1);
    setStepIdx((i) => i - 1);
  };

  const analyzeProfile = async (platform: Platform) => {
    if (platform === "shorts") return;
    setError(null);
    const url = profileLinks[platform].trim();
    if (!url) {
      setError("paste the profile link first");
      return;
    }
    setAnalyzing(platform);
    try {
      const res = await fetch("/api/analyze-profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform, url }),
      });
      const body = (await res.json()) as Partial<PlatformMetrics> & { error?: string };
      if (!res.ok) {
        setError(body.error ?? "could not analyze that profile");
        return;
      }
      const nextMetrics: PlatformMetrics = {
        followerCount: body.followerCount ?? null,
        postCount: body.postCount ?? null,
        averageViews: body.averageViews ?? null,
        confidence: body.confidence ?? "low",
        message: body.message ?? "Profile checked.",
      };
      setMetrics((m) => ({ ...m, [platform]: nextMetrics }));
      if (nextMetrics.followerCount) {
        setFollowers((f) => ({
          ...f,
          [platform]: nextMetrics.followerCount!.toLocaleString("en-US"),
        }));
      }
      if (nextMetrics.confidence === "low") setError(nextMetrics.message);
    } catch {
      setError("could not reach that profile — enter the metrics manually");
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink text-[#faf6ef]">
      {/* progress */}
      <div className="fixed inset-x-0 top-0 z-50 h-1.5 bg-[#faf6ef]/10">
        <motion.div
          className="h-full bg-[#a8d98a]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <header className="flex items-center justify-between px-6 py-5">
        <span className="font-serif text-xl font-extrabold text-[#f2a3df]">MCC®</span>
        <span className="num text-xs font-bold uppercase tracking-widest text-[#faf6ef]/40">
          {Math.min(stepIdx + 1, steps.length)} / {steps.length}
        </span>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={stepIdx}
            custom={dir}
            initial={{ opacity: 0, y: dir * 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dir * -60 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl"
          >
            {/* QUESTION — typed out */}
            <h1 className="font-serif min-h-[2.2em] text-3xl font-extrabold leading-tight sm:text-5xl">
              <TypeOnce text={step.q} speed={22} onDone={() => setTyped(true)} />
            </h1>
            {step.sub && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: typed ? 1 : 0 }}
                className="mt-3 text-base font-medium text-[#faf6ef]/50"
              >
                {step.sub}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: typed ? 1 : 0, y: typed ? 0 : 16 }}
              transition={{ duration: 0.25 }}
              className="mt-10"
            >
              {/* TEXT INPUT */}
              {step.kind === "text" && (
                <input
                  ref={inputRef}
                  type={step.type ?? "text"}
                  value={values[step.id]}
                  placeholder={step.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [step.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  className="w-full border-b-4 border-[#faf6ef]/20 bg-transparent pb-3 font-serif text-3xl font-bold text-[#a8d98a] placeholder:text-[#faf6ef]/15 focus:border-[#f2a3df] focus:outline-none sm:text-5xl"
                  style={{ boxShadow: "none", borderRadius: 0 }}
                />
              )}

              {/* PLATFORM PICK */}
              {step.kind === "platforms" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {PLATFORMS.map(({ id, label, Logo, tint }, i) => {
                    const on = platforms.includes(id);
                    return (
                      <motion.button
                        key={id}
                        initial={{ opacity: 0, y: 24, rotate: i % 2 ? 2 : -2 }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        transition={{ delay: 0.05 * i }}
                        whileHover={{ scale: 1.06, rotate: i % 2 ? 2 : -2 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() =>
                          setPlatforms((ps) => (on ? ps.filter((x) => x !== id) : [...ps, id]))
                        }
                        className={cn(
                          "relative flex flex-col items-center gap-3 rounded-[24px] border-[3px] p-7 transition-colors cursor-pointer",
                          on
                            ? "border-transparent text-ink"
                            : "border-[#faf6ef]/20 text-[#faf6ef] hover:border-[#faf6ef]/50",
                        )}
                        style={on ? { background: tint } : undefined}
                      >
                        {on && (
                          <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[#a8d98a]">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                        <Logo className="h-12 w-12" />
                        <span className="font-serif text-lg font-bold">{label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* PROFILE LINK + METRICS */}
              {step.kind === "profile" && (
                <div className="space-y-7">
                  <div className="flex items-end gap-4">
                    {(() => {
                      const P = PLATFORMS.find((x) => x.id === step.platform)!;
                      return <P.Logo className="mb-3 h-10 w-10 shrink-0 text-[#f2a3df]" />;
                    })()}
                    <input
                      ref={inputRef}
                      type="url"
                      value={profileLinks[step.platform]}
                      placeholder={
                        step.platform === "tiktok"
                          ? "https://www.tiktok.com/@yourhandle"
                          : step.platform === "reels"
                            ? "https://www.instagram.com/yourhandle"
                            : "https://www.youtube.com/@yourhandle"
                      }
                      onChange={(e) =>
                        setProfileLinks((links) => ({
                          ...links,
                          [step.platform]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && next()}
                      className="w-full border-b-4 border-[#faf6ef]/20 bg-transparent pb-3 font-serif text-2xl font-bold text-[#a8d98a] placeholder:text-[#faf6ef]/15 focus:border-[#f2a3df] focus:outline-none sm:text-4xl"
                      style={{ boxShadow: "none", borderRadius: 0 }}
                    />
                  </div>

                  {step.platform !== "shorts" && (
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => analyzeProfile(step.platform)}
                      disabled={analyzing === step.platform}
                      className="inline-flex items-center gap-2 rounded-full bg-[#f2a3df] px-5 py-3 font-serif text-sm font-bold text-ink disabled:opacity-60 cursor-pointer"
                    >
                      {analyzing === step.platform ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Analyze public profile
                    </motion.button>
                  )}

                  {metrics[step.platform] && (
                    <div className="rounded-[22px] border-2 border-[#faf6ef]/15 bg-[#faf6ef]/5 p-4">
                      <p className="text-sm font-bold text-[#faf6ef]/70">{metrics[step.platform]?.message}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          ["followers", metrics[step.platform]?.followerCount],
                          ["posts", metrics[step.platform]?.postCount],
                          ["avg views", metrics[step.platform]?.averageViews],
                        ].map(([label, value]) => (
                          <span key={label} className="rounded-full bg-[#101805] px-3 py-1.5 text-xs font-bold text-[#a8d98a]">
                            {label}: <span className="num">{typeof value === "number" ? formatCompact(value) : "manual"}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-[#faf6ef]/40">
                      Followers {metrics[step.platform]?.followerCount ? "(auto-filled)" : "(manual fallback)"}
                    </label>
                    <input
                      inputMode="numeric"
                      value={followers[step.platform]}
                      placeholder="12,500"
                      onChange={(e) =>
                        setFollowers((f) => ({
                          ...f,
                          [step.platform]: e.target.value.replace(/[^\d,]/g, ""),
                        }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && next()}
                      className="num w-full border-b-4 border-[#faf6ef]/20 bg-transparent pb-3 font-serif text-4xl font-bold text-[#a8d98a] placeholder:text-[#faf6ef]/15 focus:border-[#f2a3df] focus:outline-none sm:text-6xl"
                      style={{ boxShadow: "none", borderRadius: 0 }}
                    />
                  </div>

                  {totalFollowers > 0 && (
                    <motion.p
                      key={tier}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-5 text-sm font-bold text-[#faf6ef]/60"
                    >
                      <span className="num">{formatCompact(totalFollowers)}</span> combined →{" "}
                      <span className="sticker bg-[#f2a3df] text-ink">{TIER_LABELS[tier]} tier</span>
                    </motion.p>
                  )}
                </div>
              )}

              {/* DONE */}
              {step.kind === "done" && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-wrap items-center gap-3"
                >
                  {platforms.map((p) => {
                    const P = PLATFORMS.find((x) => x.id === p)!;
                    return (
                      <span key={p} className="flex items-center gap-2 rounded-full bg-[#faf6ef]/10 px-4 py-2 text-sm font-bold">
                        <P.Logo className="h-4 w-4" />
                        <span className="num">{formatCompact(followerCountFor(p))}</span>
                      </span>
                    );
                  })}
                  <span className="sticker bg-[#a8d98a] text-ink">{TIER_LABELS[tier]} tier</span>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-[#a8d98a]">
                    <span className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-[#a8d98a]" /> Open to Work
                  </span>
                </motion.div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-4 text-sm font-bold text-[#f2a3df]"
                >
                  ↳ {error}
                </motion.p>
              )}

              {/* NAV */}
              <div className="mt-10 flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={next}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-8 py-4 font-serif text-lg font-bold cursor-pointer",
                    step.kind === "done" ? "bg-[#a8d98a] text-ink" : "bg-[#f2a3df] text-ink",
                  )}
                >
                  {step.kind === "done" ? (
                    <>
                      <Rocket className="h-5 w-5" /> Enter your dashboard
                    </>
                  ) : (
                    <>
                      OK <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </motion.button>
                {step.kind !== "done" && (
                  <span className="hidden text-xs font-bold uppercase tracking-widest text-[#faf6ef]/30 sm:block">
                    press Enter ↵
                  </span>
                )}
                {stepIdx > 0 && step.kind !== "done" && (
                  <button
                    onClick={back}
                    className="ml-auto flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold text-[#faf6ef]/40 transition-colors hover:text-[#faf6ef] cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" /> back
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* floating blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-10 top-1/4 h-32 w-32 animate-float rounded-[40%_60%_55%_45%/55%_45%_60%_40%] bg-[#f2a3df]/15" />
        <div className="absolute -right-8 bottom-1/4 h-40 w-40 animate-float rounded-[60%_40%_45%_55%/45%_55%_40%_60%] bg-[#a8d98a]/15 [animation-delay:1s]" />
      </div>
    </div>
  );
}
