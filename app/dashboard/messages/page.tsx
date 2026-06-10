"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { CardSkeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { companyById } from "@/lib/seed";
import { daysAgo } from "@/lib/format";
import { fetchProfileNames } from "@/lib/sync";

export default function MessagesPage() {
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const role = useSession((s) => s.role);
  const isDemo = useSession((s) => s.isDemo);
  const { gigs, messages, creators } = useApp();
  const [profileNames, setProfileNames] = useState<Record<string, { name: string; hue: number }>>({});

  const myGigs = userId ? gigs.filter((g) =>
    role === "creator" ? g.creatorId === userId : g.companyId === userId,
  ) : [];
  const companyIds = Array.from(new Set(myGigs.map((g) => g.companyId)));
  const companyIdsKey = companyIds.join(",");
  const threads = myGigs
    .map((g) => ({
      gig: g,
      last: [...messages].reverse().find((m) => m.gigId === g.id),
    }))
    .filter((t) => t.last)
    .sort((a, b) => (b.last!.createdAt ?? "").localeCompare(a.last!.createdAt ?? ""));

  useEffect(() => {
    if (isDemo || role !== "creator" || myGigs.length === 0) return;
    let cancelled = false;
    void fetchProfileNames(companyIds).then((names) => {
      if (!cancelled) setProfileNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [companyIdsKey, isDemo, role]);

  if (!hydrated || !userId) return <CardSkeleton />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-4xl sm:text-5xl font-extrabold leading-[0.95]">Messages</h1>
        <p className="mt-2 text-sm font-bold text-text-secondary">
          Every negotiation stays on-platform — offers, scripts, and files in one thread.
        </p>
      </div>
      {threads.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          body="Threads open automatically when a gig starts. You'll never lose a brief in email again."
        />
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {threads.map(({ gig, last }) => {
            const other =
              role === "creator"
                ? {
                    name: companyById(gig.companyId)?.name ?? profileNames[gig.companyId]?.name ?? "Brand",
                    hue: companyById(gig.companyId)?.logoHue ?? profileNames[gig.companyId]?.hue ?? 285,
                  }
                : (() => {
                    const c = creators.find((c) => c.id === gig.creatorId);
                    return { name: c?.name ?? "Creator", hue: c?.avatarHue ?? 0 };
                  })();
            const preview =
              last!.kind === "text"
                ? last!.text
                : last!.kind === "offer"
                  ? "📋 Offer card"
                  : last!.kind === "script"
                    ? "✨ Script card"
                    : `📎 ${last!.attachmentName}`;
            return (
              <Link
                key={gig.id}
                href={`/gig/${gig.id}`}
                className="flex items-center gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-0 hover:bg-surface-2/40"
              >
                <Avatar name={other.name} hue={other.hue} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium">{other.name}</p>
                    <span className="num shrink-0 text-[11px] text-text-tertiary">{daysAgo(last!.createdAt)}</span>
                  </div>
                  <p className="truncate text-[13px] text-text-secondary">{preview}</p>
                  <p className="mt-0.5 truncate text-xs text-text-tertiary">{gig.title}</p>
                </div>
                <StatusPill status={gig.status} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
