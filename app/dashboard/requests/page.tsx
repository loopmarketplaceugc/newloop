"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useSession } from "@/lib/store/session";
import { useHydrated } from "@/lib/store/app";
import { cn } from "@/lib/utils";

const PLATFORMS = [
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
  created_at: string;
  brand_name?: string;
}

function CompanyRequestsView({ userId }: { userId: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [numCreators, setNumCreators] = useState(1);
  const [reelsPerCreator, setReelsPerCreator] = useState(1);
  const [payPerCreator, setPayPerCreator] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [merchIncluded, setMerchIncluded] = useState(false);
  const [merchDescription, setMerchDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      const [reqRes, countRes] = await Promise.all([
        fetch(`/api/requests?companyId=${userId}`),
        fetch(`/api/requests/apply?companyId=${userId}`),
      ]);
      const reqData = (await reqRes.json()) as { requests?: Request[] };
      const countData = (await countRes.json()) as { counts?: Record<string, number> };
      setRequests(reqData.requests ?? []);
      setPendingCounts(countData.counts ?? {});
    } catch {
      // non-fatal
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [userId]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/requests?id=${id}&companyId=${userId}`, { method: "DELETE" });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyId: userId,
          title,
          description,
          platforms: selectedPlatforms,
          numCreators,
          reelsPerCreator,
          payPerCreator,
          deadlineAt: deadline || null,
          merchIncluded,
          merchDescription: merchIncluded ? merchDescription : null,
        }),
      });
      setSuccess(true);
      setTitle("");
      setDescription("");
      setSelectedPlatforms([]);
      setNumCreators(1);
      setReelsPerCreator(1);
      setPayPerCreator(0);
      setDeadline("");
      setMerchIncluded(false);
      setMerchDescription("");
      void loadRequests();
      setTimeout(() => { setSuccess(false); setFormOpen(false); }, 2000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl font-extrabold leading-[0.95] sm:text-5xl">Requests</h1>
          <p className="mt-2 text-sm font-bold text-text-secondary">
            Post UGC requests and review creator applications.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-serif text-sm font-bold text-[#f2a3df] shadow-[0_4px_14px_-4px_rgba(16,24,5,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New request
          {formOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Form — toggleable */}
      <AnimatePresence>
        {formOpen && (
          <motion.form
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={(e) => { void handleSubmit(e); }}
            className="overflow-hidden rounded-[28px] border border-ink/10 bg-surface p-6 shadow-[0_2px_12px_rgba(16,24,5,0.06)] space-y-5"
          >
            <div>
              <label className="block text-[13px] font-bold uppercase tracking-widest text-text-tertiary mb-1.5">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Spring skincare UGC"
                className="w-full rounded-xl border-2 border-ink/20 bg-white px-4 py-3 font-serif text-lg font-bold focus:border-ink focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold uppercase tracking-widest text-text-tertiary mb-1.5">Brief</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you want creators to make…"
                rows={4}
                className="w-full rounded-xl border-2 border-ink/20 bg-white px-4 py-3 font-bold text-[15px] leading-relaxed focus:border-ink focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold uppercase tracking-widest text-text-tertiary mb-2">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={cn(
                      "rounded-full border-[2.5px] px-4 py-2 text-sm font-bold transition-colors cursor-pointer",
                      selectedPlatforms.includes(p.id)
                        ? "border-transparent bg-[#f2a3df] text-ink"
                        : "border-ink/20 text-ink hover:border-ink",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-[13px] font-bold uppercase tracking-widest text-text-tertiary mb-1.5">Creators</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={numCreators}
                  onChange={(e) => setNumCreators(Number(e.target.value))}
                  className="w-full rounded-xl border-2 border-ink/20 bg-white px-4 py-3 font-bold focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold uppercase tracking-widest text-text-tertiary mb-1.5">Reels / creator</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={reelsPerCreator}
                  onChange={(e) => setReelsPerCreator(Number(e.target.value))}
                  className="w-full rounded-xl border-2 border-ink/20 bg-white px-4 py-3 font-bold focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold uppercase tracking-widest text-text-tertiary mb-1.5">Pay / creator ($)</label>
                <input
                  type="number"
                  min={0}
                  value={payPerCreator}
                  onChange={(e) => setPayPerCreator(Number(e.target.value))}
                  className="w-full rounded-xl border-2 border-ink/20 bg-white px-4 py-3 font-bold focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold uppercase tracking-widest text-text-tertiary mb-1.5">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded-xl border-2 border-ink/20 bg-white px-4 py-3 font-bold focus:border-ink focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <label className="text-[13px] font-bold uppercase tracking-widest text-text-tertiary">Merch included?</label>
                <button
                  type="button"
                  onClick={() => setMerchIncluded((v) => !v)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full border-2 border-ink/20 transition-colors cursor-pointer",
                    merchIncluded ? "bg-[#a8d98a]" : "bg-ink/10",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-ink transition-transform",
                      merchIncluded ? "translate-x-5" : "translate-x-1",
                    )}
                  />
                </button>
              </div>
              {merchIncluded && (
                <input
                  value={merchDescription}
                  onChange={(e) => setMerchDescription(e.target.value)}
                  placeholder="What's being shipped?"
                  className="mt-3 w-full rounded-xl border-2 border-ink/20 bg-white px-4 py-3 font-bold focus:border-ink focus:outline-none"
                />
              )}
            </div>

            {success && (
              <p className="rounded-xl bg-[#a8d98a] px-4 py-3 text-sm font-bold text-ink">
                Request posted! Creators can now apply.
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-ink px-8 py-4 font-serif text-lg font-bold text-[#f2a3df] shadow-[0_6px_20px_-6px_rgba(16,24,5,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Posting…" : "Post request →"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Posted requests — always visible */}
      {loadingRequests && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-[24px] bg-ink/8" />
          ))}
        </div>
      )}

      {!loadingRequests && requests.length === 0 && !formOpen && (
        <div className="rounded-[20px] border-2 border-dashed border-ink/20 py-16 text-center">
          <p className="font-serif text-xl font-bold text-ink/40">No requests yet</p>
          <p className="mt-1 text-sm text-text-tertiary">Post your first request with the button above.</p>
        </div>
      )}

      {requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((r) => {
            const pending = pendingCounts[r.id] ?? 0;
            return (
              <div
                key={r.id}
                className="group relative flex items-start justify-between gap-3 rounded-[24px] border border-ink/10 bg-surface p-5 shadow-[0_1px_3px_rgba(16,24,5,0.05)] transition-all hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_12px_32px_-10px_rgba(16,24,5,0.18)]"
              >
                <Link href={`/dashboard/requests/${r.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-serif text-lg font-extrabold">{r.title}</p>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                        r.status === "open" ? "bg-[#a8d98a] text-ink" : "bg-ink/10 text-ink",
                      )}
                    >
                      {r.status}
                    </span>
                    {pending > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {pending} new
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">
                    {r.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.platforms.map((p) => (
                      <span key={p} className="rounded-full bg-ink/8 px-2.5 py-1 text-[11px] font-bold">
                        {PLATFORMS.find((pl) => pl.id === p)?.label ?? p}
                      </span>
                    ))}
                    {r.merch_included && (
                      <span className="rounded-full bg-[#f2a3df] px-2.5 py-1 text-[11px] font-bold text-ink">
                        merch
                      </span>
                    )}
                  </div>
                  <p className="num mt-2 text-sm font-bold text-text-tertiary">
                    ${(r.pay_per_creator_cents / 100).toFixed(0)} / creator · {r.num_creators} creators needed
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { void handleDelete(r.id); }}
                    disabled={deletingId === r.id}
                    className="rounded-full p-2 text-ink/30 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40 cursor-pointer"
                    aria-label="Delete request"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/dashboard/requests/${r.id}`}
                    className="rounded-full border border-ink/15 px-4 py-2 text-[12px] font-bold text-text-secondary transition-colors group-hover:border-ink/30 group-hover:text-text-primary"
                  >
                    View →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreatorRequestsView({ userId: _userId }: { userId: string }) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/requests")
      .then((r) => r.json() as Promise<{ requests?: Request[] }>)
      .then((d) => setRequests(d.requests ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl font-extrabold leading-[0.95] sm:text-5xl">Requests</h1>
        <p className="mt-2 text-sm font-bold text-text-secondary">
          Open UGC requests from brands. Tap one to see the full offer and apply.
        </p>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-[20px] bg-ink/8" />
          ))}
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="rounded-[20px] border-2 border-dashed border-ink/20 py-16 text-center">
          <p className="font-serif text-xl font-bold text-ink/40">No open requests right now</p>
          <p className="mt-1 text-sm text-text-tertiary">Check back soon — new brand requests appear here.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {requests.map((r) => (
          <Link
            key={r.id}
            href={`/dashboard/requests/${r.id}`}
            className="group flex items-center justify-between gap-4 rounded-[24px] border border-ink/10 bg-surface px-5 py-4 shadow-[0_1px_3px_rgba(16,24,5,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_12px_32px_-10px_rgba(16,24,5,0.20)]"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
                {r.brand_name ?? "Brand"}
              </p>
              <p className="mt-1 truncate font-serif text-lg font-extrabold leading-tight">{r.title}</p>
              <p className="num mt-0.5 text-sm font-bold text-money">
                ${(r.pay_per_creator_cents / 100).toFixed(0)} <span className="text-text-tertiary">/ creator</span>
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#f2a3df] px-7 py-3.5 font-serif text-[15px] font-bold text-ink shadow-[0_4px_14px_-4px_rgba(242,163,223,0.7)] transition-transform group-hover:scale-[1.04]">
              Apply →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function RequestsPage() {
  const hydrated = useHydrated();
  const { userId, role } = useSession();

  if (!hydrated || !userId || !role) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-[20px] bg-ink/8" />
        ))}
      </div>
    );
  }

  if (role === "company") return <CompanyRequestsView userId={userId} />;
  return <CreatorRequestsView userId={userId} />;
}
