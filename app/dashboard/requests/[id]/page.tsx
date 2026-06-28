"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Users, X } from "lucide-react";
import { useSession } from "@/lib/store/session";
import { useHydrated } from "@/lib/store/app";
import { cn } from "@/lib/utils";

const PLATFORMS: { id: string; label: string }[] = [
  { id: "tiktok", label: "TikTok" },
  { id: "reels", label: "Instagram Reels" },
  { id: "shorts", label: "YouTube Shorts" },
];

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

interface Applicant {
  id: string;
  creator_id: string;
  note: string | null;
  status: string;
  applied_at: string;
  profile: { id: string; name: string; handle: string; avatar_hue: number; bio: string | null } | null;
  creator_details: { niches: string[] | null; tier: string | null } | null;
}

type AppActionState = { type: "idle" } | { type: "loading" } | { type: "approved"; gigId: string } | { type: "rejected" };

function ApplicantCard({ applicant, onAction }: {
  applicant: Applicant;
  onAction: (applicationId: string, action: "approve" | "reject") => Promise<{ gigId?: string }>;
}) {
  const [state, setState] = useState<AppActionState>(
    applicant.status === "accepted"
      ? { type: "approved", gigId: "" }
      : applicant.status === "rejected"
      ? { type: "rejected" }
      : { type: "idle" },
  );

  const name = applicant.profile?.name ?? "Creator";
  const handle = applicant.profile?.handle;
  const tier = applicant.creator_details?.tier;
  const niches = applicant.creator_details?.niches ?? [];
  const hue = applicant.profile?.avatar_hue ?? 285;

  const handleAction = async (action: "approve" | "reject") => {
    setState({ type: "loading" });
    try {
      const result = await onAction(applicant.id, action);
      if (action === "approve") {
        setState({ type: "approved", gigId: result.gigId ?? "" });
      } else {
        setState({ type: "rejected" });
      }
    } catch {
      setState({ type: "idle" });
    }
  };

  return (
    <motion.div
      layout
      className={cn(
        "rounded-[20px] border bg-surface p-5 transition-colors",
        state.type === "approved" ? "border-[#a8d98a] bg-[#a8d98a]/5" :
        state.type === "rejected" ? "border-ink/8 opacity-50" :
        "border-ink/10",
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: `hsl(${hue} 55% 50%)` }}
        >
          {name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-serif text-[15px] font-extrabold">{name}</p>
            {tier && (
              <span className="rounded-full bg-ink/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                {tier}
              </span>
            )}
            {state.type === "approved" && (
              <span className="flex items-center gap-1 rounded-full bg-[#a8d98a] px-2.5 py-0.5 text-[11px] font-bold text-ink">
                <Check className="h-3 w-3" /> Approved
              </span>
            )}
            {state.type === "rejected" && (
              <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-[11px] font-bold text-ink/50">
                Declined
              </span>
            )}
          </div>
          {handle && <p className="text-[12px] text-text-tertiary">@{handle}</p>}
          {niches.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {niches.slice(0, 4).map((n) => (
                <span key={n} className="rounded-full bg-[#f2a3df]/30 px-2 py-0.5 text-[11px] font-bold text-ink">
                  {n}
                </span>
              ))}
            </div>
          )}
          {applicant.note && (
            <p className="mt-2 rounded-[10px] bg-ink/5 px-3 py-2 text-[13px] leading-relaxed text-text-secondary">
              &ldquo;{applicant.note}&rdquo;
            </p>
          )}

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {state.type === "approved" && state.gigId && (
              <Link
                href={`/gig/${state.gigId}`}
                className="rounded-full bg-ink px-4 py-2 text-[12px] font-bold text-[#a8d98a] transition-opacity hover:opacity-80"
              >
                View gig →
              </Link>
            )}
            {state.type === "idle" && (
              <>
                <button
                  onClick={() => void handleAction("approve")}
                  className="flex items-center gap-1.5 rounded-full bg-[#a8d98a] px-4 py-2 text-[12px] font-bold text-ink transition-opacity hover:opacity-80 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  onClick={() => void handleAction("reject")}
                  className="flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-[12px] font-bold text-text-secondary transition-colors hover:border-ink/30 hover:text-text-primary cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" /> Decline
                </button>
              </>
            )}
            {state.type === "loading" && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
            )}
            {handle && (
              <Link
                href={`/creator/${handle}`}
                className="rounded-full border border-ink/15 px-3 py-2 text-[12px] font-bold text-text-secondary transition-colors hover:border-ink/40 hover:text-text-primary"
              >
                View profile →
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CompanyDetailView({ request }: { request: Request }) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    void fetch(`/api/requests/apply?requestId=${request.id}`)
      .then((r) => r.json() as Promise<{ applications?: Applicant[] }>)
      .then((d) => setApplicants(d.applications ?? []))
      .catch(() => null)
      .finally(() => setLoadingApps(false));
  }, [request.id]);

  const handleAction = async (applicationId: string, action: "approve" | "reject") => {
    const res = await fetch("/api/requests/apply", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationId, action }),
    });
    if (!res.ok) throw new Error("Action failed");
    const data = (await res.json()) as { gigId?: string };
    return { gigId: data.gigId };
  };

  const pendingCount = applicants.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Request summary */}
      <div className="rounded-[24px] border border-ink/10 bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-serif text-2xl font-extrabold">{request.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{request.description}</p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
              request.status === "open" ? "bg-[#a8d98a] text-ink" : "bg-ink/10 text-ink",
            )}
          >
            {request.status}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {request.platforms.map((p) => (
            <span key={p} className="rounded-full bg-ink/8 px-2.5 py-1 text-[11px] font-bold">
              {PLATFORMS.find((pl) => pl.id === p)?.label ?? p}
            </span>
          ))}
          {request.merch_included && (
            <span className="rounded-full bg-[#f2a3df] px-2.5 py-1 text-[11px] font-bold text-ink">
              {request.merch_description ?? "merch included"}
            </span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { value: `$${(request.pay_per_creator_cents / 100).toFixed(0)}`, label: "per creator" },
            { value: String(request.num_creators), label: "creators needed" },
            {
              value: request.deadline_at
                ? new Date(request.deadline_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "Open",
              label: "deadline",
            },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-[12px] bg-ink/5 px-2 py-2.5">
              <p className="num font-serif text-lg font-extrabold">{value}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Applicants */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-text-secondary" />
          <h2 className="font-serif text-xl font-extrabold">
            Applications
            {!loadingApps && (
              <span className="ml-2 rounded-full bg-ink/8 px-2 py-0.5 text-[13px] font-bold">
                {applicants.length}
              </span>
            )}
          </h2>
          {!loadingApps && pendingCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {pendingCount} pending
            </span>
          )}
        </div>

        {loadingApps && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-[20px] bg-ink/8" />
            ))}
          </div>
        )}

        {!loadingApps && applicants.length === 0 && (
          <div className="rounded-[20px] border-2 border-dashed border-ink/20 py-12 text-center">
            <p className="font-serif text-lg font-bold text-ink/40">No applications yet</p>
            <p className="mt-1 text-sm text-text-tertiary">
              Creators will appear here once they apply.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {applicants.map((a) => (
            <ApplicantCard key={a.id} applicant={a} onAction={handleAction} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CreatorDetailView({ request, userId }: { request: Request; userId: string }) {
  const [note, setNote] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [checkingApplied, setCheckingApplied] = useState(true);

  useEffect(() => {
    void fetch(`/api/requests/apply?creatorId=${userId}`)
      .then((r) => r.json() as Promise<{ applications?: { request_id: string }[] }>)
      .then((d) => {
        const ids = new Set((d.applications ?? []).map((a) => a.request_id));
        if (ids.has(request.id)) setApplied(true);
      })
      .catch(() => null)
      .finally(() => setCheckingApplied(false));
  }, [request.id, userId]);

  const handleApply = async () => {
    if (applied) return;
    setApplying(true);
    try {
      await fetch("/api/requests/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: request.id, creatorId: userId, note: note || null }),
      });
      setApplied(true);
    } finally {
      setApplying(false);
    }
  };

  const payAmount = (request.pay_per_creator_cents / 100).toFixed(0);

  return (
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

          {/* Description */}
          <p className="mt-5 text-[15px] leading-relaxed text-text-secondary">{request.description}</p>

          {/* Platforms + merch */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {request.platforms.map((p) => (
              <span key={p} className="rounded-full bg-ink/8 px-3 py-1.5 text-[12px] font-bold">
                {PLATFORMS.find((pl) => pl.id === p)?.label ?? p}
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
            {checkingApplied ? (
              <div className="flex justify-center py-6">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink/20 border-t-ink" />
              </div>
            ) : (
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
                    <p className="text-sm font-medium text-text-secondary">They&apos;ll be in touch soon.</p>
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
                      className={cn(
                        "w-full cursor-pointer rounded-full py-5 font-serif text-xl font-bold transition-colors disabled:opacity-60",
                        "bg-[#f2a3df] text-ink hover:bg-[#f2a3df]/90",
                      )}
                    >
                      {applying ? "Applying…" : "Apply now →"}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const role = useSession((s) => s.role);

  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void fetch(`/api/requests?id=${id}`)
      .then((r) => r.json() as Promise<{ request?: Request; error?: string }>)
      .then((d) => { if (d.request) setRequest(d.request); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

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
        <p className="font-serif text-2xl font-extrabold">Request not found</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-[#faf6ef] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-2 pb-20">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-ink transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> All requests
      </button>

      {role === "company" ? (
        <CompanyDetailView request={request} />
      ) : (
        userId && <CreatorDetailView request={request} userId={userId} />
      )}
    </div>
  );
}
