"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { TypeCycle, TypeOnce } from "@/components/shared/typewriter";
import { Marquee } from "@/components/shared/marquee";
import { TikTokLogo, InstagramLogo, YouTubeLogo } from "@/components/shared/brand-logos";

const pop = {
  initial: { opacity: 0, y: 40, scale: 0.96 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProg } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroProg, [0, 1], [0, 120]);
  const blobY = useTransform(heroProg, [0, 1], [0, -160]);
  const { scrollYProgress: darkProg } = useScroll({ target: darkRef, offset: ["start end", "end start"] });
  const darkY = useTransform(darkProg, [0, 1], [80, -80]);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f2a3df]">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-[#f2a3df]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="font-serif text-2xl font-extrabold tracking-tight text-ink">
            MCC<span className="text-[10px] align-super">®</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-bold text-ink transition-transform hover:scale-105"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-ink px-5 py-2 text-sm font-bold text-[#f2a3df] transition-transform hover:scale-105"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* HERO — pink, massive type, typewriter */}
      <section ref={heroRef} className="relative bg-[#f2a3df] px-5 pb-24 pt-16 sm:pt-24">
        {/* floating blobs */}
        <motion.div style={{ y: blobY }} className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-[6%] top-[16%] h-24 w-24 animate-float rounded-[40%_60%_55%_45%/55%_45%_60%_40%] bg-[#a8d98a]" />
          <div className="absolute right-[10%] top-[10%] h-16 w-16 animate-float rounded-full bg-ink [animation-delay:1.2s]" />
          <div className="absolute bottom-[12%] right-[20%] h-28 w-28 animate-float rounded-[60%_40%_45%_55%/45%_55%_40%_60%] bg-[#a8d98a] [animation-delay:0.6s]" />
        </motion.div>

        <motion.div style={{ y: heroY }} className="relative mx-auto max-w-6xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-sm font-bold uppercase tracking-[0.2em] text-ink/70"
          >
            The marketplace for content creation
          </motion.p>
          <h1 className="display-xl mt-4 text-ink text-[17vw] leading-[0.88] sm:text-[11rem]">
            UGC,
            <br />
            <span className="block min-h-[0.95em]">
              <TypeCycle words={["PAID.", "SCRIPTED.", "SIGNED.", "SHIPPED.", "VIRAL."]} />
            </span>
          </h1>
          <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <p className="max-w-md text-lg font-medium leading-snug text-ink/80">
              Creators meet brands. AI writes the script, escrow holds the money,
              contracts sign themselves. You just create.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <motion.div whileHover={{ scale: 1.06, rotate: -1 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href="/signup?role=creator"
                  className="flex items-center gap-2 rounded-full bg-ink px-7 py-4 font-serif text-lg font-bold text-[#f2a3df]"
                >
                  I&apos;m a Creator <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.06, rotate: 1 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href="/signup?role=company"
                  className="flex items-center gap-2 rounded-full border-[3px] border-ink px-7 py-4 font-serif text-lg font-bold text-ink"
                >
                  I&apos;m a Brand <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>
            </div>
          </div>
          <div className="mt-14 flex items-center gap-3 text-ink/60">
            <ArrowDown className="h-5 w-5 animate-bounce" />
            <span className="text-sm font-bold uppercase tracking-widest">scroll</span>
          </div>
        </motion.div>
      </section>

      {/* MARQUEE — ink strip */}
      <div className="border-y-2 border-ink bg-ink text-[#a8d98a]">
        <Marquee items={["Escrow protected", "AI scripts", "10% flat fee", "No ghosting", "Auto contracts", "Usage rights tracked"]} />
      </div>

      {/* HOW IT WORKS — lime */}
      <section className="bg-[#a8d98a] px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.h2 {...pop} className="display-xl text-[14vw] text-ink sm:text-8xl">
            How it<br />works<span className="text-[#f2a3df]" style={{ WebkitTextStroke: "3px #101805" }}>*</span>
          </motion.h2>
          <p className="mt-4 max-w-sm font-bold text-ink/70">*from first DM to money in the bank, without leaving the app.</p>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { n: "01", t: "Match", d: "Brands filter creators by niche, tier, rate & capacity. Slide into the gig chat — offers are cards, not vibes.", bg: "bg-ink", fg: "text-[#a8d98a]" },
              { n: "02", t: "Create", d: "AI writes the script with timed hooks. Escrow gets funded BEFORE you film. Contract generates itself.", bg: "bg-[#f2a3df]", fg: "text-ink" },
              { n: "03", t: "Get paid", d: "Brand approves → money releases instantly. They ghost? Auto-approves in 14 days. You keep 90%.", bg: "bg-[#faf6ef]", fg: "text-ink" },
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

      {/* DARK — parallax statement */}
      <section ref={darkRef} className="relative overflow-hidden bg-ink px-5 py-32">
        <motion.div style={{ y: darkY }} className="mx-auto max-w-5xl text-center">
          <motion.h2 {...pop} className="display-xl text-[13vw] text-[#f2a3df] sm:text-[7.5rem]">
            Get paid.
            <br />
            Not <span className="sticker bg-[#a8d98a] text-ink">ghosted</span>.
          </motion.h2>
          <motion.p {...pop} className="mx-auto mt-8 max-w-lg text-lg font-medium text-[#faf6ef]/70">
            Every gig is escrow-funded up front. Every contract tracks your usage
            rights and reminds the brand 7 days before they expire. Every silence
            auto-approves in 14 days.
          </motion.p>
          <motion.div {...pop} className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {["💸 funds held in escrow", "📜 auto-contracts", "⏰ 14-day auto-approve", "🔁 max 2 revisions"].map((t, i) => (
              <span
                key={t}
                className={`rounded-full border-2 px-4 py-2 text-sm font-bold ${i % 2 ? "border-[#a8d98a] text-[#a8d98a]" : "border-[#f2a3df] text-[#f2a3df]"}`}
              >
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* MARQUEE reverse */}
      <div className="border-y-2 border-ink bg-[#faf6ef] text-ink">
        <Marquee reverse items={["TikTok", "Reels", "Shorts", "Beauty", "Tech", "Food", "Fitness", "SaaS"]} separator="→" />
      </div>

      {/* AI SECTION — typing demo */}
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

      {/* FINAL CTA — lime */}
      <section className="bg-[#a8d98a] px-5 py-28 text-center">
        <motion.h2 {...pop} className="display-xl mx-auto max-w-4xl text-[15vw] text-ink sm:text-9xl">
          Make it.
          <br />
          <span className="text-[#faf6ef]" style={{ WebkitTextStroke: "4px #101805" }}>Bank it.</span>
        </motion.h2>
        <motion.div {...pop} className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <motion.div whileHover={{ scale: 1.07, rotate: -2 }} whileTap={{ scale: 0.95 }}>
            <Link href="/signup?role=creator" className="block rounded-full bg-ink px-9 py-5 font-serif text-xl font-bold text-[#a8d98a]">
              Start creating →
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.07, rotate: 2 }} whileTap={{ scale: 0.95 }}>
            <Link href="/signup?role=company" className="block rounded-full border-[3px] border-ink px-9 py-5 font-serif text-xl font-bold text-ink">
              Find creators →
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <footer className="bg-ink px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm font-bold text-[#faf6ef]/60 sm:flex-row">
          <span className="font-serif text-xl text-[#f2a3df]">MCC®</span>
          <span>© 2026 — creators keep 90% of every gig</span>
        </div>
      </footer>
    </div>
  );
}
