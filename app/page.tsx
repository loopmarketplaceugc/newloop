"use client";

import { useRef } from "react";
import Link from "next/link";
import { useSession } from "@/lib/store/session";
import { motion, useScroll, useTransform, useMotionTemplate, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowDown, Heart, MessageCircle, Share2, Music2, Bookmark } from "lucide-react";
import { TypeCycle, TypeOnce } from "@/components/shared/typewriter";
import { Marquee } from "@/components/shared/marquee";
import { TikTokLogo, InstagramLogo, YouTubeLogo, BrandLogo } from "@/components/shared/brand-logos";

const pop = {
  initial: { opacity: 0, y: 40, scale: 0.96 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay },
});

const BRANDS = ["Nike", "Glossier", "Chipotle", "Duolingo", "Notion", "Sephora", "Starbucks", "Gymshark"] as const;

/* ── iPhone mockup with TikTok-style animated screen ── */
function IPhoneMockup() {
  return (
    <div className="relative mx-auto w-fit">
      {/* Phone frame */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotate: 3 }}
        animate={{ opacity: 1, y: 0, rotate: 3 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        className="relative"
        style={{ filter: "drop-shadow(0 40px 80px rgba(16,24,5,0.35))" }}
      >
        <div
          className="relative overflow-hidden bg-[#0a0a0a]"
          style={{
            width: 220,
            height: 440,
            borderRadius: 44,
            border: "8px solid #1a1a1a",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 2px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Dynamic Island */}
          <div
            className="absolute left-1/2 top-2.5 z-20 -translate-x-1/2 bg-[#0a0a0a]"
            style={{ width: 80, height: 22, borderRadius: 20 }}
          />

          {/* Video content — animated gradient reel */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "linear-gradient(160deg, #c96442 0%, #f2a3df 40%, #a8d98a 100%)",
                "linear-gradient(200deg, #3d7a5a 0%, #a8d98a 40%, #f2a3df 100%)",
                "linear-gradient(120deg, #f2a3df 0%, #c96442 50%, #101805 100%)",
                "linear-gradient(160deg, #c96442 0%, #f2a3df 40%, #a8d98a 100%)",
              ],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Product label in video */}
          <div className="absolute left-3 top-16 z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md"
            >
              Nike × loop
            </motion.div>
          </div>

          {/* Right sidebar — TikTok style actions */}
          <div className="absolute bottom-20 right-2.5 z-10 flex flex-col items-center gap-4">
            {[
              { icon: Heart, label: "48.2K", color: "#f2a3df" },
              { icon: MessageCircle, label: "1.3K", color: "white" },
              { icon: Bookmark, label: "Save", color: "white" },
              { icon: Share2, label: "Share", color: "white" },
            ].map(({ icon: Icon, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + i * 0.1, type: "spring", stiffness: 300 }}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <span className="text-[8px] font-bold text-white/80">{label}</span>
              </motion.div>
            ))}
          </div>

          {/* Bottom creator info */}
          <div className="absolute bottom-4 left-3 right-12 z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
            >
              <p className="text-[11px] font-bold text-white">@miaCreates</p>
              <p className="mt-0.5 text-[10px] font-medium leading-tight text-white/70">
                POV: testing the shoe everyone&apos;s wearing rn 👟✨
              </p>
              <div className="mt-1.5 flex items-center gap-1">
                <Music2 className="h-2.5 w-2.5 text-white/60" />
                <span className="text-[9px] text-white/60">original sound · miaCreates</span>
              </div>
            </motion.div>
          </div>

          {/* Live indicator */}
          <motion.div
            className="absolute right-3 top-6 z-10 flex items-center gap-1 rounded-full bg-[#f2a3df] px-2 py-0.5"
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-ink" />
            <span className="text-[8px] font-extrabold text-ink">LIVE</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating earnings card */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -bottom-4 -left-16 z-20"
      >
        <div className="flex items-center gap-2.5 rounded-2xl border-[2.5px] border-ink bg-[#faf6ef] px-3.5 py-3 shadow-[4px_4px_0_0_#101805]">
          <BrandLogo brand="Nike" size={32} />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary">payout</p>
            <p className="num font-serif text-xl font-extrabold text-[#3e7b5e]">$650</p>
            <p className="text-[9px] font-bold text-text-secondary">Nike Run Club · 30s reel</p>
          </div>
        </div>
      </motion.div>

      {/* Floating match badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.9, duration: 0.5, type: "spring", stiffness: 280 }}
        className="absolute -right-12 top-10 z-20"
      >
        <div className="rounded-xl border-[2.5px] border-ink bg-[#a8d98a] px-3 py-2 shadow-[3px_3px_0_0_#101805]">
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-ink">your match</p>
          <p className="text-[11px] font-bold text-ink">Glossier ✓</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  const userId = useSession((s) => s.userId);
  const heroRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProg } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroProg, [0, 1], [0, 120]);
  const blobY = useTransform(heroProg, [0, 1], [0, -160]);
  const { scrollYProgress: darkProg } = useScroll({ target: darkRef, offset: ["start end", "end start"] });
  const darkY = useTransform(darkProg, [0, 1], [80, -80]);

  // Pill: starts wide, shrinks on scroll
  const { scrollY } = useScroll();
  const pillMaxWidth = useTransform(scrollY, [0, 220], [1400, 600]);
  const pillPaddingX = useTransform(scrollY, [0, 220], [32, 20]);
  const pillPaddingY = useTransform(scrollY, [0, 220], [18, 12]);
  const bgAlpha = useTransform(scrollY, [0, 220], [0.07, 0.92]);
  const pillBg = useMotionTemplate`rgba(250,246,239,${bgAlpha})`;
  const taglineOpacity = useTransform(scrollY, [0, 120], [1, 0]);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f2a3df]">

      {/* NAV — wide pill that shrinks on scroll */}
      <div className="sticky top-0 z-40 flex justify-center px-4 pt-3 pb-1.5">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          style={{
            maxWidth: pillMaxWidth,
            background: pillBg,
            paddingLeft: pillPaddingX,
            paddingRight: pillPaddingX,
            paddingTop: pillPaddingY,
            paddingBottom: pillPaddingY,
          }}
          className="flex w-full items-center justify-between gap-4 rounded-full border border-[#6b3e1e]/30 shadow-[0_8px_40px_-8px_rgba(92,45,14,0.28)] backdrop-blur-2xl"
        >
          <Link href="/" className="font-serif text-xl font-extrabold tracking-tight text-ink shrink-0">
            loop
          </Link>

          {/* Centre tagline — fades out on scroll */}
          <motion.span
            style={{ opacity: taglineOpacity }}
            className="hidden md:block font-serif text-sm font-bold text-ink/50 select-none"
          >
            The UGC marketplace
          </motion.span>

          <div className="flex items-center gap-2 shrink-0">
            {userId ? (
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
                <Link
                  href="/dashboard"
                  className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-bold text-[#f2a3df] shadow-[2px_2px_0_0_rgba(16,24,5,0.4)] transition-shadow hover:shadow-[3px_3px_0_0_rgba(16,24,5,0.5)]"
                >
                  Dashboard →
                </Link>
              </motion.div>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    href="/login"
                    className="rounded-full px-5 py-2.5 text-[14px] font-bold text-ink/80 hover:text-ink hover:bg-ink/8 transition-colors"
                  >
                    Log in
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
                  <Link
                    href="/signup"
                    className="rounded-full bg-ink px-6 py-2.5 text-[14px] font-bold text-[#f2a3df] shadow-[2px_2px_0_0_rgba(16,24,5,0.4)] transition-shadow hover:shadow-[3px_3px_0_0_rgba(16,24,5,0.5)]"
                  >
                    Sign up free →
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* HERO */}
      <section ref={heroRef} className="relative bg-[#f2a3df] px-5 pb-24 pt-10 sm:pt-16">
        <motion.div style={{ y: blobY }} className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-[6%] top-[16%] h-24 w-24 animate-float rounded-[40%_60%_55%_45%/55%_45%_60%_40%] bg-[#a8d98a]" />
          <div className="absolute right-[10%] top-[10%] h-16 w-16 animate-float rounded-full bg-ink [animation-delay:1.2s]" />
          <div className="absolute bottom-[12%] right-[20%] h-28 w-28 animate-float rounded-[60%_40%_45%_55%/45%_55%_40%_60%] bg-[#a8d98a] [animation-delay:0.6s]" />
        </motion.div>

        <motion.div style={{ y: heroY }} className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_300px]">
            {/* LEFT: text */}
            <div>
              <motion.p {...fadeUp(0)} className="font-serif text-sm font-bold uppercase tracking-[0.2em] text-ink/70">
                The marketplace for content creation
              </motion.p>
              <h1 className="display-xl mt-4 text-ink text-[17vw] leading-[0.86] sm:text-[9rem] lg:text-[11rem]">
                <span className="reveal-line">
                  <span>UGC,</span>
                </span>
                <span className="reveal-line">
                  <span
                    className="block min-h-[0.95em] text-[#faf6ef]"
                    style={{ WebkitTextStroke: "0", textShadow: "5px 5px 0 #101805", animationDelay: "0.12s" }}
                  >
                    <TypeCycle words={["PAID.", "SCRIPTED.", "SIGNED.", "SHIPPED.", "VIRAL."]} />
                  </span>
                </span>
              </h1>
              <motion.div {...fadeUp(0.3)} className="mt-10 flex flex-col items-start gap-6">
                <p className="max-w-md text-base font-medium leading-snug text-ink/80 sm:text-lg">
                  Creators meet brands. AI writes the script, Stripe handles the money,
                  contracts sign themselves. You just create.
                </p>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <motion.div whileHover={{ scale: 1.06, rotate: -1 }} whileTap={{ scale: 0.96 }}>
                    <Link
                      href="/signup?role=creator"
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-7 py-4 font-serif text-base font-bold text-[#f2a3df] sm:w-auto sm:text-lg"
                    >
                      Sign up as Creator <ArrowRight className="h-5 w-5" />
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.06, rotate: 1 }} whileTap={{ scale: 0.96 }}>
                    <Link
                      href="/signup?role=company"
                      className="flex w-full items-center justify-center gap-2 rounded-full border-[3px] border-ink px-7 py-4 font-serif text-base font-bold text-ink sm:w-auto sm:text-lg"
                    >
                      Sign up as Brand <ArrowRight className="h-5 w-5" />
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
              <motion.div {...fadeUp(0.5)} className="mt-10 flex items-center gap-3 text-ink/60">
                <ArrowDown className="h-5 w-5 animate-bounce" />
                <span className="text-sm font-bold uppercase tracking-widest">scroll</span>
              </motion.div>
            </div>

            {/* RIGHT: iPhone + earnings */}
            <div className="hidden items-center justify-center lg:flex">
              <IPhoneMockup />
            </div>
          </div>
        </motion.div>
      </section>

      {/* MARQUEE */}
      <div className="border-y-2 border-ink bg-ink text-[#a8d98a]">
        <Marquee items={["Stripe payments", "AI scripts", "Funds held safely", "No ghosting", "Auto contracts", "Usage rights tracked"]} />
      </div>

      {/* BRANDS STRIP */}
      <section className="border-b-2 border-ink bg-[#faf6ef] px-5 py-10">
        <motion.p {...pop} className="mb-7 text-center text-[11px] font-extrabold uppercase tracking-[0.25em] text-text-tertiary">
          Brands posting on loop
        </motion.p>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-5">
          {BRANDS.map((brand, i) => (
            <motion.div
              key={brand}
              initial={{ opacity: 0, scale: 0.85, y: 12 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.1, y: -4 }}
            >
              <BrandLogo brand={brand} size={52} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#a8d98a] px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.h2 {...pop} className="display-xl text-[14vw] text-ink sm:text-8xl">
            How it<br />works<span className="text-[#f2a3df]" style={{ WebkitTextStroke: "3px #101805" }}>*</span>
          </motion.h2>
          <p className="mt-4 max-w-sm font-bold text-ink/70">*from first DM to money in the bank, without leaving the app.</p>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { n: "01", t: "Match", d: "Brands filter creators by niche, tier, rate & capacity. Slide into the gig chat — offers are cards, not vibes.", bg: "bg-ink", fg: "text-[#a8d98a]" },
              { n: "02", t: "Create", d: "AI writes the script with timed hooks. The brand pays BEFORE you film. Contract generates itself.", bg: "bg-[#f2a3df]", fg: "text-ink" },
              { n: "03", t: "Get paid", d: "Brand approves → money releases instantly. They ghost? Auto-approves in 14 days. Payouts land in your wallet.", bg: "bg-[#faf6ef]", fg: "text-ink" },
            ].map((c, i) => (
              <motion.div
                key={c.n}
                {...pop}
                transition={{ ...pop.transition, delay: i * 0.12 }}
                whileHover={{ y: -10, rotate: i === 1 ? 1.5 : -1.5 }}
                className={`rounded-[24px] border-[3px] border-ink p-7 ${c.bg} ${c.fg}`}
              >
                <span className="num text-sm font-bold opacity-60">{c.n}</span>
                <h3 className="font-serif mt-2 text-4xl font-extrabold">{c.t}</h3>
                <p className="mt-3 text-[15px] font-medium leading-relaxed opacity-90">{c.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT CREATORS EARN */}
      <section className="border-y-2 border-ink bg-[#faf6ef] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.h2 {...pop} className="font-serif text-4xl font-extrabold text-ink sm:text-5xl">
            What creators actually earn
          </motion.h2>
          <motion.p {...pop} className="mt-2 text-sm font-bold text-text-secondary">
            Real demo payouts — base pay + view bonuses deposited via Stripe.
          </motion.p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { brand: "Nike", campaign: "Run Club drop", base: "$650", bonus: "+$500 views", color: "#111111", textColor: "#ffffff" },
              { brand: "Glossier", campaign: "GRWM glow", base: "$520", bonus: "+$450 views", color: "#f4c2c2", textColor: "#111111" },
              { brand: "Notion", campaign: "Workspace reset", base: "$700", bonus: "+$500 views", color: "#ffffff", textColor: "#111111" },
              { brand: "Gymshark", campaign: "Leg day fit test", base: "$620", bonus: "+$600 views", color: "#0d0d0d", textColor: "#ffffff" },
            ].map(({ brand, campaign, base, bonus, color, textColor }, i) => (
              <motion.div
                key={brand}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8, rotate: i % 2 === 0 ? -1.5 : 1.5 }}
                className="rounded-[20px] border-[2.5px] border-ink p-5 shadow-[4px_4px_0_0_#101805]"
                style={{ background: color, color: textColor }}
              >
                <BrandLogo brand={brand} size={40} />
                <p className="mt-4 text-[11px] font-extrabold uppercase tracking-wider opacity-60">{campaign}</p>
                <p className="num mt-1 font-serif text-3xl font-extrabold">{base}</p>
                <p className="mt-1 text-xs font-bold opacity-70">{bonus} cap</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DARK — parallax statement */}
      <section ref={darkRef} className="relative overflow-hidden bg-ink px-5 py-32">
        <motion.div style={{ y: darkY }} className="mx-auto max-w-5xl text-center">
          <motion.h2 {...pop} className="display-xl text-[13vw] sm:text-[7.5rem]">
            <span className="text-gradient">Get paid.</span>
            <br />
            <span className="text-[#faf6ef]">Not </span>
            <span className="sticker bg-[#a8d98a] text-ink">ghosted</span>
            <span className="text-[#faf6ef]">.</span>
          </motion.h2>
          <motion.p {...pop} className="mx-auto mt-8 max-w-lg text-lg font-medium text-[#faf6ef]/70">
            Every gig is paid up front. Every contract tracks your usage
            rights and reminds the brand 7 days before they expire. Every silence
            auto-approves in 14 days.
          </motion.p>
          <motion.div {...pop} className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {["💸 Stripe payments", "📜 auto-contracts", "⏰ 14-day auto-approve", "🔁 max 2 revisions"].map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.08 }}
                className={`rounded-full border-2 px-4 py-2 text-sm font-bold ${i % 2 ? "border-[#a8d98a] text-[#a8d98a]" : "border-[#f2a3df] text-[#f2a3df]"}`}
              >
                {t}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* MARQUEE reverse */}
      <div className="border-y-2 border-ink bg-[#faf6ef] text-ink">
        <Marquee reverse items={["TikTok", "Reels", "Shorts", "Beauty", "Tech", "Food", "Fitness", "SaaS"]} separator="→" />
      </div>

      {/* AI SECTION */}
      <section className="bg-[#f2a3df] px-5 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div>
            <motion.h2 {...pop} className="display-xl text-[14vw] text-ink sm:text-8xl">
              AI writes.
              <br />
              You film.
            </motion.h2>
            <motion.p {...pop} className="mt-5 max-w-md text-lg font-medium text-ink/80">
              Timed hooks, retention-tested bodies, CTAs that don&apos;t feel like
              CTAs. Pick a tone — Chaotic, Aesthetic, Educational, Testimonial —
              and send it straight into the chat.
            </motion.p>
            <motion.div {...pop} whileHover={{ scale: 1.05 }} className="mt-8 inline-block">
              <Link
                href="/signup?role=company"
                className="flex items-center gap-2 rounded-full bg-ink px-7 py-4 font-serif text-lg font-bold text-[#a8d98a]"
              >
                Generate a script <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
          <motion.div {...pop} className="rounded-[24px] border-[3px] border-ink bg-ink p-6 shadow-[8px_8px_0_0_#101805]">
            <div className="flex items-center gap-1.5 pb-4">
              <span className="h-3 w-3 rounded-full bg-[#f2a3df]" />
              <span className="h-3 w-3 rounded-full bg-[#a8d98a]" />
              <span className="h-3 w-3 rounded-full bg-[#faf6ef]" />
              <span className="ml-2 text-xs font-bold uppercase tracking-widest text-[#faf6ef]/50">script_engine.exe</span>
            </div>
            <div className="num min-h-44 space-y-3 text-[15px] leading-relaxed">
              <p className="font-bold text-[#a8d98a]">[0:00–0:03 HOOK]</p>
              <p className="text-[#faf6ef]">
                <TypeOnce text="STOP scrolling — I need to talk about this serum for exactly 30 seconds…" speed={45} />
              </p>
              <p className="font-bold text-[#f2a3df]">[0:03–0:25 BODY]</p>
              <p className="text-[#faf6ef]/70">
                <TypeOnce text="Show the texture pull. Day 1 vs day 7, same light, no filter…" speed={55} />
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PLATFORMS strip */}
      <section className="border-y-2 border-ink bg-[#faf6ef] px-5 py-16">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-10 sm:gap-16">
          {[
            { Logo: TikTokLogo, label: "TikTok" },
            { Logo: InstagramLogo, label: "Reels" },
            { Logo: YouTubeLogo, label: "Shorts" },
          ].map(({ Logo, label }, i) => (
            <motion.div
              key={label}
              {...pop}
              transition={{ ...pop.transition, delay: i * 0.1 }}
              whileHover={{ scale: 1.15, rotate: i % 2 ? 4 : -4 }}
              className="flex flex-col items-center gap-2 text-ink"
            >
              <Logo className="h-14 w-14 sm:h-20 sm:w-20" />
              <span className="font-serif text-lg font-bold">{label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#a8d98a] px-5 py-20 text-center sm:py-28">
        <motion.h2 {...pop} className="display-xl mx-auto max-w-4xl text-[15vw] text-ink sm:text-9xl">
          Make it.
          <br />
          <span className="text-[#faf6ef]" style={{ WebkitTextStroke: "4px #101805" }}>Bank it.</span>
        </motion.h2>
        <motion.div {...pop} className="mt-10 flex flex-col items-stretch justify-center gap-4 px-2 sm:flex-row sm:items-center sm:px-0">
          <motion.div whileHover={{ scale: 1.07, rotate: -2 }} whileTap={{ scale: 0.95 }}>
            <Link href="/signup?role=creator" className="block rounded-full bg-ink px-9 py-4 font-serif text-lg font-bold text-[#a8d98a] sm:py-5 sm:text-xl">
              Start creating →
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.07, rotate: 2 }} whileTap={{ scale: 0.95 }}>
            <Link href="/signup?role=company" className="block rounded-full border-[3px] border-ink px-9 py-4 font-serif text-lg font-bold text-ink sm:py-5 sm:text-xl">
              Find creators →
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <footer className="bg-ink px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm font-bold text-[#faf6ef]/60 sm:flex-row">
          <span className="font-serif text-xl text-[#f2a3df]">loop</span>
          <span>© 2026 — secure creator payouts</span>
          <div className="flex gap-4 text-[11px] font-medium text-[#faf6ef]/30">
            <Link href="/legal#privacy" className="hover:text-[#faf6ef]/60 transition-colors">Privacy</Link>
            <Link href="/legal#terms" className="hover:text-[#faf6ef]/60 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
