"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  MessageSquare,
  QrCode as QrIcon,
  Sparkles,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { haptics } from "@/lib/haptics";

const TOUR_KEY = "loop-creator-tour-v1";

const STEPS: { icon: LucideIcon; title: string; body: string; tint: string }[] = [
  {
    icon: Wallet,
    title: "See exactly what you're making",
    body: "Your earnings, secured payments, and approved payouts sit right at the top — real numbers, derived from real gigs. No guessing.",
    tint: "#a8d98a",
  },
  {
    icon: Compass,
    title: "Find opportunities",
    body: "Hit Find opportunities to browse brands hiring creators like you. Pitch yourself and open a chat in one tap.",
    tint: "#f2a3df",
  },
  {
    icon: ArrowRight,
    title: "Track what's in progress & due",
    body: "Active gigs show up as a clean board, and anything with a deadline lands in Due soon so nothing slips.",
    tint: "#a8d98a",
  },
  {
    icon: Sparkles,
    title: "Brainstorm in the Idea Studio",
    body: "Stuck on what to post? The Idea Studio chats with you to spin up hooks, angles, and full scripts that land deals.",
    tint: "#f2a3df",
  },
  {
    icon: QrIcon,
    title: "Your Loop tag is your identity",
    body: "You've been certified with a unique Loop tag and QR code. Brands scan it to pull up your verified profile instantly.",
    tint: "#a8d98a",
  },
  {
    icon: MessageSquare,
    title: "Everything stays on-platform",
    body: "Offers, scripts, files, and payments live in your chats — and your phone buzzes the moment a brand replies.",
    tint: "#f2a3df",
  },
];

/** First-run walkthrough for newly certified creators. Shows once per device. */
export function CreatorTour() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(TOUR_KEY)) {
      const t = setTimeout(() => {
        setOpen(true);
        haptics.step();
      }, 500);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    localStorage.setItem(TOUR_KEY, "1");
    haptics.success();
    setOpen(false);
  };

  const next = () => {
    if (i >= STEPS.length - 1) return close();
    haptics.step();
    setI((n) => n + 1);
  };

  if (!open) return null;
  const step = STEPS[i];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-5 backdrop-blur-sm"
        onClick={close}
      >
        <motion.div
          key={i}
          initial={{ scale: 0.92, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md overflow-hidden rounded-[28px] border-[3px] border-ink bg-surface shadow-[8px_8px_0_0_#101805]"
        >
          <button
            onClick={close}
            className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary cursor-pointer"
            aria-label="Skip tour"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center px-7 pb-7 pt-10 text-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-[20px] border-2 border-ink"
              style={{ background: step.tint }}
            >
              <step.icon className="h-8 w-8 text-ink" />
            </span>
            <h2 className="font-serif mt-5 text-2xl font-extrabold leading-tight">{step.title}</h2>
            <p className="mt-2.5 text-sm font-medium leading-relaxed text-text-secondary">
              {step.body}
            </p>

            <div className="mt-6 flex items-center gap-1.5">
              {STEPS.map((_, n) => (
                <span
                  key={n}
                  className={
                    "h-2 rounded-full transition-all " +
                    (n === i ? "w-6 bg-[#d6409f]" : "w-2 bg-ink/15")
                  }
                />
              ))}
            </div>

            <button
              onClick={next}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 font-serif text-base font-bold text-[#faf6ef] transition-transform hover:scale-[1.02] cursor-pointer"
            >
              {i >= STEPS.length - 1 ? "Start creating" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </button>
            {i < STEPS.length - 1 && (
              <button
                onClick={close}
                className="mt-2 text-xs font-bold text-text-tertiary hover:text-text-secondary cursor-pointer"
              >
                Skip tour
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
