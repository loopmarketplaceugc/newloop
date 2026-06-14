"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Rocket } from "lucide-react";
import { useSession } from "@/lib/store/session";
import { useApp } from "@/lib/store/app";
import { saveCreatorNickname, certifyCreator } from "@/lib/auth";
import { haptics } from "@/lib/haptics";
import { DEMO_CREATOR_ID } from "@/lib/seed";
import { QrCode } from "@/components/shared/qr-code";
import { TypeOnce } from "@/components/shared/typewriter";
import { TikTokLogo, InstagramLogo, YouTubeLogo } from "@/components/shared/brand-logos";
import { tierForFollowers, TIER_LABELS, type Platform } from "@/lib/types";
import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

const PLATFORMS: { id: Platform; label: string; Logo: typeof TikTokLogo; tint: string }[] = [
  { id: "tiktok", label: "TikTok", Logo: TikTokLogo, tint: "#f2a3df" },
  { id: "reels", label: "Instagram", Logo: InstagramLogo, tint: "#a8d98a" },
  { id: "shorts", label: "YouTube", Logo: YouTubeLogo, tint: "#faf6ef" },
];

type Step =
  | { kind: "nickname"; q: string; sub: string }
  | { kind: "platforms"; q: string; sub: string }
  | { kind: "followers"; platform: Platform; q: string; sub: string }
  | { kind: "done"; q: string; sub: string };

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
  const [nickname, setNickname] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [followers, setFollowers] = useState<Record<Platform, string>>({ tiktok: "", reels: "", shorts: "" });
  const [mccTag, setMccTag] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const steps: Step[] = useMemo(
    () => [
      {
        kind: "nickname",
        q: "What's your creator name?",
        sub: "This is how brands and your audience will know you — pick whatever you go by.",
      },
      {
        kind: "platforms",
        q: `Nice, ${nickname || "creator"}. Where do you post?`,
        sub: "Tap everything that applies.",
      },
      ...platforms.map((p) => ({
        kind: "followers" as const,
        platform: p,
        q: `How many followers on ${PLATFORMS.find((x) => x.id === p)!.label}?`,
        sub: "Rough number is totally fine — brands care about your content, not just the count.",
      })),
      {
        kind: "done",
        q: `You're in, ${nickname || "creator"}.`,
        sub: "Profile live. Brands can find you and scan your QR to see your page.",
      },
    ],
    [platforms, nickname],
  );

  const step = steps[Math.min(stepIdx, steps.length - 1)];
  const progress = Math.round((stepIdx / (steps.length - 1)) * 100);

  const followerCountFor = (p: Platform) => numericInput(followers[p]);
  const totalFollowers = platforms.reduce((s, p) => s + followerCountFor(p), 0);
  const tier = tierForFollowers(totalFollowers);

  useEffect(() => {
    setTyped(false);
    setError(null);
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [stepIdx]);

  useEffect(() => {
    if (step.kind !== "done" || mccTag) return;
    let cancelled = false;
    void certifyCreator().then((tag) => {
      if (cancelled) return;
      setMccTag(tag);
      haptics.celebrate();
      const id = session.isDemo ? DEMO_CREATOR_ID : session.userId ?? DEMO_CREATOR_ID;
      useApp.getState().updateCreator(id, { mccTag: tag, name: nickname });
    });
    return () => {
      cancelled = true;
    };
  }, [step.kind, mccTag, session.isDemo, session.userId, nickname]);

  const next = () => {
    setError(null);

    if (step.kind === "nickname") {
      const clean = nickname.trim();
      if (clean.length < 2) {
        haptics.error();
        setError("need at least 2 characters — how do you want to be known?");
        return;
      }
    }

    if (step.kind === "platforms" && platforms.length === 0) {
      haptics.error();
      setError("pick at least one — this is how brands filter creators");
      return;
    }

    if (step.kind === "followers") {
      if (followerCountFor(step.platform) <= 0) {
        setError("enter your follower count — even an estimate works");
        return;
      }
    }

    if (step.kind === "done") {
      const platformRows = platforms.map((p) => ({
        platform: p,
        followerCount: followerCountFor(p),
      }));
      const id = session.isDemo ? DEMO_CREATOR_ID : (session.userId ?? DEMO_CREATOR_ID);
      ensureCreator(id, {
        name: nickname,
        status: "open",
        tier,
        platforms: platformRows.map((r) => ({ platform: r.platform, url: "", followerCount: r.followerCount })),
      });
      setName(nickname);
      void saveCreatorNickname({ nickname, platforms: platformRows });
      completeOnboarding();
      router.push("/dashboard");
      return;
    }

    haptics.step();
    setDir(1);
    setStepIdx((i) => i + 1);
  };

  const back = () => {
    if (stepIdx === 0) return;
    setDir(-1);
    setStepIdx((i) => i - 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink text-[#faf6ef]">
      {/* progress bar */}
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
              {/* NICKNAME */}
              {step.kind === "nickname" && (
                <input
                  ref={inputRef}
                  type="text"
                  value={nickname}
                  placeholder="e.g. MiaCreates"
                  onChange={(e) => {
                    haptics.tap();
                    setNickname(e.target.value);
                  }}
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
                        onClick={() => {
                          haptics.select();
                          setPlatforms((ps) => (on ? ps.filter((x) => x !== id) : [...ps, id]));
                        }}
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

              {/* FOLLOWER COUNT */}
              {step.kind === "followers" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    {(() => {
                      const P = PLATFORMS.find((x) => x.id === step.platform)!;
                      return <P.Logo className="h-10 w-10 shrink-0 text-[#f2a3df]" />;
                    })()}
                    <input
                      ref={inputRef}
                      inputMode="numeric"
                      value={followers[step.platform]}
                      placeholder="10,000"
                      onChange={(e) =>
                        setFollowers((f) => ({ ...f, [step.platform]: e.target.value.replace(/[^\d,]/g, "") }))
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
                      className="text-sm font-bold text-[#faf6ef]/60"
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
                  className="space-y-6"
                >
                  <div className="flex flex-wrap items-center gap-3">
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
                  </div>

                  <div className="flex flex-col gap-5 rounded-[24px] border-[3px] border-[#faf6ef]/15 bg-[#faf6ef]/[0.04] p-6 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <span className="sticker bg-[#f2a3df] text-[11px] text-ink">certified creator</span>
                      <p className="mt-3 text-xs font-bold uppercase tracking-widest text-[#faf6ef]/40">
                        Your MCC tag
                      </p>
                      <p className="num mt-1 font-serif text-3xl font-extrabold text-[#a8d98a] sm:text-4xl">
                        {mccTag ?? "minting…"}
                      </p>
                      <p className="mt-3 max-w-xs text-sm font-medium leading-relaxed text-[#faf6ef]/55">
                        Brands scan this to instantly see your verified profile — your name, tier, and portfolio in one tap.
                      </p>
                    </div>
                    {mccTag && (
                      <QrCode
                        value={`${origin}/creator/${mccTag}`}
                        size={150}
                        label={`MCC tag ${mccTag}`}
                      />
                    )}
                  </div>
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

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-10 top-1/4 h-32 w-32 animate-float rounded-[40%_60%_55%_45%/55%_45%_60%_40%] bg-[#f2a3df]/15" />
        <div className="absolute -right-8 bottom-1/4 h-40 w-40 animate-float rounded-[60%_40%_45%_55%/45%_55%_40%_60%] bg-[#a8d98a]/15 [animation-delay:1s]" />
      </div>
    </div>
  );
}
