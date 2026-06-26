"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { CardSkeleton } from "@/components/ui/skeleton";

interface Request {
  id: string;
  title: string;
  pay_per_creator_cents: number;
  platforms: string[];
  merch_included: boolean;
  status: string;
  brand_name?: string;
}

export default function OpportunitiesPage() {
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const [requests, setRequests] = useState<Request[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    void Promise.all([
      fetch("/api/requests").then((r) => r.json() as Promise<{ requests?: Request[] }>),
      fetch(`/api/requests/apply?creatorId=${userId}`).then(
        (r) => r.json() as Promise<{ applications?: { request_id: string }[] }>,
      ),
    ])
      .then(([reqData, appData]) => {
        setRequests(reqData.requests ?? []);
        setAppliedIds(new Set((appData.applications ?? []).map((a) => a.request_id)));
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [userId]);

  if (!hydrated || !userId) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl font-extrabold leading-[0.95] sm:text-5xl">
          Opportunities
        </h1>
        <p className="mt-2 text-sm font-bold text-text-secondary">
          Brand campaigns looking for creators. Click to see the full brief and apply.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-[24px] bg-ink/8" />
          ))}
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="rounded-[20px] border-2 border-dashed border-ink/20 py-16 text-center">
          <p className="font-serif text-xl font-bold text-ink/40">No open opportunities right now</p>
          <p className="mt-1 text-sm text-text-tertiary">
            Check back soon — brands post new campaigns here.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {requests.map((r) => {
          const alreadyApplied = appliedIds.has(r.id);
          return (
            <Link
              key={r.id}
              href={`/dashboard/opportunities/${r.id}`}
              className="group flex items-center gap-4 rounded-[24px] border border-ink/10 bg-surface px-5 py-4 shadow-[0_1px_3px_rgba(16,24,5,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_12px_32px_-10px_rgba(16,24,5,0.20)]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary">
                  {r.brand_name ?? "Brand"}
                </p>
                <p className="mt-0.5 truncate font-serif text-[15px] font-extrabold leading-tight">
                  {r.title}
                </p>
                <p className="num mt-0.5 text-sm font-bold text-money">
                  ${(r.pay_per_creator_cents / 100).toFixed(0)}{" "}
                  <span className="font-medium text-text-tertiary">/ creator</span>
                </p>
              </div>

              {alreadyApplied ? (
                <span className="shrink-0 flex items-center gap-1.5 rounded-full bg-[#a8d98a] px-5 py-3 font-serif text-[14px] font-bold text-ink">
                  <Check className="h-4 w-4" /> Applied
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-[#f2a3df] px-7 py-3.5 font-serif text-[15px] font-bold text-ink shadow-[0_4px_14px_-4px_rgba(242,163,223,0.7)] transition-transform group-hover:scale-[1.04]">
                  Apply →
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
