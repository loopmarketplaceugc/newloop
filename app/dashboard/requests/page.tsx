"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
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

  const loadRequests = async () => {
    try {
      const res = await fetch(`/api/requests?companyId=${userId}`);
      const data = (await res.json()) as { requests?: Request[] };
      setRequests(data.requests ?? []);
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
      setTimeout(() => setSuccess(false), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-extrabold leading-[0.95] sm:text-5xl">Requests</h1>
        <p className="mt-2 text-sm font-bold text-text-secondary">
          Post a UGC request. Creators apply and you choose who to work with.
        </p>
      </div>

      <form
        onSubmit={(e) => { void handleSubmit(e); }}
        className="rounded-[24px] border-[3px] border-ink bg-[#faf6ef] p-6 shadow-[6px_6px_0_0_#101805] space-y-5"
      >
        <h2 className="font-serif text-2xl font-extrabold">New request</h2>

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
          className="rounded-full bg-ink px-8 py-4 font-serif text-lg font-bold text-[#f2a3df] transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {submitting ? "Posting…" : "Post request →"}
        </button>
      </form>

      {requests.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-extrabold">Your requests</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {requests.map((r) => (
              <div key={r.id} className="rounded-[20px] border-[2.5px] border-ink bg-[#faf6ef] p-5 shadow-[4px_4px_0_0_#101805]">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-serif text-lg font-extrabold">{r.title}</p>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                      r.status === "open" ? "bg-[#a8d98a] text-ink" : "bg-ink/10 text-ink",
                    )}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-secondary">{r.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
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
                <p className="num mt-3 text-sm font-bold text-text-tertiary">
                  ${(r.pay_per_creator_cents / 100).toFixed(0)} / creator · {r.num_creators} creators
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loadingRequests && requests.length === 0 && (
        <div className="rounded-[20px] border-2 border-dashed border-ink/20 py-16 text-center">
          <p className="font-serif text-xl font-bold text-ink/40">No requests yet</p>
          <p className="mt-1 text-sm text-text-tertiary">Post your first request above.</p>
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
            className="group flex items-center justify-between gap-4 rounded-[20px] border-[2.5px] border-ink bg-[#faf6ef] px-5 py-4 shadow-[4px_4px_0_0_#101805] transition-shadow hover:shadow-[6px_6px_0_0_#101805]"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                {r.brand_name ?? "Brand"}
              </p>
              <p className="mt-0.5 truncate font-serif text-lg font-extrabold leading-tight">{r.title}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <p className="num font-serif text-xl font-extrabold text-[#3e7b5e]">
                ${(r.pay_per_creator_cents / 100).toFixed(0)}
              </p>
              <span className="rounded-full bg-[#f2a3df] px-5 py-2.5 font-serif text-sm font-bold text-ink transition-transform group-hover:scale-105">
                Apply →
              </span>
            </div>
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
