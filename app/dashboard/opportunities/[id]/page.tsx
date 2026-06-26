"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useSession } from "@/lib/store/session";
import { useHydrated } from "@/lib/store/app";
import { haptics } from "@/lib/haptics";
import { toast } from "@/components/ui/toast";

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  reels: "Instagram Reels",
  shorts: "YouTube Shorts",
};

interface Request {
  id: string;
  company_id: string;
  title: string;
  description: string;
  platforms: string[];
  num_creators: number;
  reels_per_creator: number;
  pay_per_creator_cents: number;
  deadline_at: string | null;
  merch_included: boolean;
  merch_description: string | null;
  status: string;
  brand_name?: string;
}

export default function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);

  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!id || !userId) return;
    void Promise.all([
      fetch(`/api/requests?id=${id}`).then((r) => r.json() as Promise<{ request?: Request }>),
      fetch(`/api/requests/apply?creatorId=${userId}`).then(
        (r) => r.json() as Promise<{ applications?: { request_id: string }[] }>,
      ),
    ])
      .then(([reqData, appData]) => {
        if (reqData.request) setRequest(reqData.request);
        const ids = new Set((appData.applications ?? []).map((a) => a.request_id));
        if (ids.has(id)) setApplied(true);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id, userId]);

  const handleApply = async () => {
    if (!userId || !request || applied) return;
    haptics.success();
    setApplying(true);
    try {
      const res = await fetch("/api/requests/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: request.id, creatorId: userId, note: note || null }),
      });
      if (res.ok) {
        setApplied(true);
        toast("Application sent!", {
          body: `${request.brand_name ?? "The brand"} will review your profile and reach out soon.`,
          tone: "success",
        });
      }
    } finally {
      setApplying(false);
    }
  };

  if (!hydrated || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-ink/20 border-t-ink" />
      </div>
    );
  }

  if (!request) {
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

  const payAmount = (request.pay_per_creator_cents / 100).toFixed(0);

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

          <div className="relative rounded-[30px] bg-[#faf6ef] px-6 pb-8 pt-7">
            {/* Brand + title */}
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
              {request.brand_name ?? "Brand"}
            </p>
            <p className="mt-1 font-serif text-2xl font-extrabold leading-tight">{request.title}</p>

            {/* Dark payout card */}
            <div className="mt-6 rounded-[22px] bg-ink px-5 py-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#faf6ef]/40">
                your payout
              </p>
              <p className="num mt-1 font-serif text-[72px] font-extrabold leading-none tracking-tight text-[#a8d98a]">
                ${payAmount}
              </p>
              <p className="mt-1 text-[13px] font-bold text-[#faf6ef]/55">
                per creator · paid via Stripe after approval
              </p>
              <div className="mt-3 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
                  <rect width="16" height="16" rx="3" fill="#625BF6" />
                  <path d="M7.2 6.1c0-.5.4-.7.9-.7.8 0 1.7.3 2.3.6V4.1C9.8 3.8 9.1 3.6 8.1 3.6 6.3 3.6 5 4.6 5 6.2c0 2.4 3.3 2 3.3 3.1 0 .6-.5.8-1.1.8-.9 0-2-.4-2.8-.9v2c.8.4 1.8.7 2.8.7 1.8 0 3.2-.9 3.2-2.6 0-2.6-3.2-2.1-3.2-3.2Z" fill="#fff" />
                </svg>
                <span className="text-[11px] font-bold text-[#faf6ef]/40">Secured via Stripe Connect</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {[
                { value: String(request.reels_per_creator), label: "reels" },
                { value: String(request.num_creators), label: "creators" },
                {
                  value: request.deadline_at
                    ? new Date(request.deadline_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "Open",
                  label: "deadline",
                },
              ].map(({ value, label }) => (
                <div key={label} className="rounded-[16px] bg-ink/5 px-3 py-3 text-center">
                  <p className="num font-serif text-[22px] font-extrabold leading-none">{value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Brief */}
            <div className="mt-5 rounded-[16px] border-2 border-ink/10 bg-ink/[0.03] p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Brief</p>
              <p className="mt-2 text-[14px] font-bold leading-relaxed text-ink">
                {request.description}
              </p>
            </div>

            {/* Platforms + merch */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {request.platforms.map((p) => (
                <span key={p} className="rounded-full bg-ink/8 px-3 py-1.5 text-[12px] font-bold">
                  {PLATFORM_LABELS[p] ?? p}
                </span>
              ))}
              {request.merch_included && (
                <span className="rounded-full bg-[#f2a3df] px-3 py-1.5 text-[12px] font-bold text-ink">
                  {request.merch_description ?? "merch included"}
                </span>
              )}
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
                    <p className="font-serif text-xl font-extrabold text-ink">
                      Applied to {request.brand_name ?? "the brand"}
                    </p>
                    <p className="text-sm font-medium text-text-secondary">
                      They&apos;ll be in touch soon.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="form" className="space-y-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                        Note to brand{" "}
                        <span className="normal-case font-medium text-text-tertiary/60">(optional)</span>
                      </p>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Tell them why you're a great fit, your content style, or any questions…"
                        rows={3}
                        className="mt-1.5 w-full resize-none rounded-xl border-2 border-ink/15 bg-white px-4 py-3 text-[14px] font-medium leading-relaxed focus:border-ink/40 focus:outline-none"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => void handleApply()}
                      disabled={applying}
                      className="w-full cursor-pointer rounded-full bg-[#f2a3df] py-5 font-serif text-xl font-bold text-ink hover:bg-[#f2a3df]/90 disabled:opacity-60"
                    >
                      {applying ? "Applying…" : "Apply now →"}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
