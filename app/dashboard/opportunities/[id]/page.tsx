"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Clock, Film, Lightbulb, ListChecks, Sparkles, TrendingUp } from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { BrandLogo } from "@/components/shared/brand-logos";
import { toast } from "@/components/ui/toast";
import { haptics } from "@/lib/haptics";
import { getOpportunity, formatPay } from "@/lib/opportunities";
import { cn } from "@/lib/utils";

export default function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const isDemo = useSession((s) => s.isDemo);
  const [applied, setApplied] = useState(false);

  const op = getOpportunity(id);

  if (!hydrated || !userId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-ink/20 border-t-ink" />
      </div>
    );
  }

  if (!op) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="font-serif text-2xl font-extrabold">Campaign not found</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-[#faf6ef] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    );
  }

  const maxPay = op.basePayCents + op.viewBonus.capCents;

  const handleApply = () => {
    haptics.success();
    const app = useApp.getState();
    const gigId = `demo-gig-${op.id}`;
    const alreadyExists = app.gigs.some((g) => g.id === gigId);
    if (!alreadyExists) {
      const now = new Date().toISOString();
      app.upsertGig({
        id: gigId,
        companyId: op.companyId,
        creatorId: userId,
        status: "DRAFT",
        title: `${op.brand} × ${op.campaign}`,
        brief: op.brief,
        platform: "tiktok",
        priceCents: op.basePayCents,
        feeCents: Math.round(op.basePayCents * 0.075),
        usageDays: 90,
        rawFootage: false,
        physicalProduct: false,
        revisionCount: 0,
        createdAt: now,
      });
      if (isDemo) {
        app.upsertMessage({
          id: `demo-msg-${op.id}`,
          gigId,
          senderId: op.companyId,
          kind: "text",
          text: `Hey! We're excited to work with you on the "${op.campaign}" campaign. Take a look at the brief and let us know if you have any questions before we send an offer.`,
          createdAt: now,
        });
      }
    }
    setApplied(true);
    toast("Application sent!", {
      body: `${op.brand} will review your profile and reach out soon.`,
      tone: "success",
    });
  };

  return (
    <div className="mx-auto max-w-lg py-2 pb-20">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-ink transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Opportunities
      </button>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
      >
        {/* Outer glow + ball shadow */}
        <div
          className="relative rounded-[32px]"
          style={{
            padding: "2.5px",
            boxShadow:
              "0 50px 100px -15px rgba(16,24,5,0.45), 0 20px 50px -10px rgba(16,24,5,0.25), 0 0 70px 4px rgba(168,217,138,0.15)",
          }}
        >
          {/* Rotating border light */}
          <div className="absolute inset-0 overflow-hidden rounded-[32px]" aria-hidden>
            <motion.div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "220%",
                height: "220%",
                marginLeft: "-110%",
                marginTop: "-110%",
                background:
                  "conic-gradient(from 0deg, transparent 0%, transparent 52%, rgba(168,217,138,0.45) 61%, rgba(255,255,255,0.92) 67%, rgba(168,217,138,0.45) 73%, transparent 84%, transparent 100%)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Card */}
          <div className="relative rounded-[30px] bg-[#faf6ef] px-6 pb-8 pt-7">

            {/* Brand header */}
            <div className="flex items-center gap-3">
              <BrandLogo brand={op.brand} size={44} />
              <div>
                <p className="font-serif text-xl font-extrabold">{op.brand}</p>
                <p className="text-[13px] font-bold text-text-secondary">{op.campaign}</p>
              </div>
            </div>

            {/* Dark payout card */}
            <div className="mt-6 rounded-[22px] bg-ink px-5 py-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#faf6ef]/40">
                your payout
              </p>
              <p className="num mt-1 font-serif text-[72px] font-extrabold leading-none tracking-tight text-[#a8d98a]">
                {formatPay(op.basePayCents)}
              </p>
              <p className="mt-1 text-[13px] font-bold text-[#faf6ef]/55">
                base pay · up to {formatPay(maxPay)} with view bonuses
              </p>
              <div className="mt-3 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
                  <rect width="16" height="16" rx="3" fill="#625BF6" />
                  <path d="M7.2 6.1c0-.5.4-.7.9-.7.8 0 1.7.3 2.3.6V4.1C9.8 3.8 9.1 3.6 8.1 3.6 6.3 3.6 5 4.6 5 6.2c0 2.4 3.3 2 3.3 3.1 0 .6-.5.8-1.1.8-.9 0-2-.4-2.8-.9v2c.8.4 1.8.7 2.8.7 1.8 0 3.2-.9 3.2-2.6 0-2.6-3.2-2.1-3.2-3.2Z" fill="#fff" />
                </svg>
                <span className="text-[11px] font-bold text-[#faf6ef]/40">Paid via Stripe after approval</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {[
                { icon: Film, label: "Platform", value: op.platform },
                { icon: ListChecks, label: "Deliverables", value: op.deliverables },
                { icon: Clock, label: "Length", value: op.videoLength },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-[16px] bg-ink/5 px-3 py-3 text-center">
                  <Icon className="mx-auto h-4 w-4 text-text-tertiary" />
                  <p className="mt-1.5 text-[11px] font-extrabold leading-tight">{value}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">{label}</p>
                </div>
              ))}
            </div>

            {/* Brief */}
            <div className="mt-5 rounded-[16px] border-2 border-ink/10 bg-ink/[0.03] p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Brief</p>
              <p className="mt-2 text-[14px] font-bold leading-relaxed text-ink">{op.brief}</p>
            </div>

            {/* Script / Trend / Idea */}
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Sparkles, label: "Script", body: op.script, bg: "bg-ink", text: "text-[#faf6ef]" },
                { icon: TrendingUp, label: "Trend", body: op.trend, bg: "bg-[#f2a3df]", text: "text-ink" },
                { icon: Lightbulb, label: "Idea", body: op.idea, bg: "bg-[#a8d98a]", text: "text-ink" },
              ].map(({ icon: Icon, label, body, bg, text }) => (
                <div key={label} className={cn("rounded-[16px] border-2 border-ink p-4", bg, text)}>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-70">
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </p>
                  <p className="mt-2 text-[12px] font-bold leading-relaxed opacity-90">{body}</p>
                </div>
              ))}
            </div>

            {/* View bonus */}
            <div className="mt-4 rounded-[16px] bg-ink/5 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">View bonus</p>
              <p className="mt-1 text-[13px] font-extrabold text-ink">
                +{formatPay(op.viewBonus.amountCents)} {op.viewBonus.trigger} · capped at +{formatPay(op.viewBonus.capCents)}
              </p>
            </div>

            {/* Apply */}
            <div className="mt-6">
              <AnimatePresence mode="wait">
                {applied ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="flex flex-col items-center gap-3 py-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.05 }}
                      className="flex h-20 w-20 items-center justify-center rounded-full bg-[#a8d98a]"
                    >
                      <Check className="h-10 w-10 stroke-[3] text-ink" />
                    </motion.div>
                    <p className="font-serif text-xl font-extrabold text-ink">Applied to {op.brand}</p>
                    <p className="text-sm font-medium text-text-secondary">They&apos;ll be in touch soon.</p>
                  </motion.div>
                ) : (
                  <motion.button
                    key="apply"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleApply}
                    className="w-full cursor-pointer rounded-full bg-[#f2a3df] py-5 font-serif text-xl font-bold text-ink hover:bg-[#f2a3df]/90"
                  >
                    Apply now →
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
