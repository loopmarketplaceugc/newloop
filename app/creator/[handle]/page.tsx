"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, MapPin, MessageSquare } from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { CardSkeleton } from "@/components/ui/skeleton";
import { TierBadge } from "@/components/shared/tier-badge";
import { StatusDot } from "@/components/shared/status-dot";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { StarRating } from "@/components/shared/star-rating";
import { COMPENSATION_LABELS, PLATFORM_LABELS } from "@/lib/types";
import { companyById } from "@/lib/seed";
import { formatCompact, formatMoney } from "@/lib/format";

export default function CreatorPublicPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);
  const hydrated = useHydrated();
  const role = useSession((s) => s.role);
  const { creators, reviews, gigs } = useApp();
  const c = creators.find((x) => x.handle === decodeURIComponent(handle));

  if (!hydrated) return <div className="mx-auto max-w-3xl p-6"><CardSkeleton /></div>;

  if (!c) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-5">
        <p className="font-serif text-2xl font-semibold">Creator not found</p>
        <Button asChild variant="outline"><Link href="/dashboard/discover">Back to Discover</Link></Button>
      </div>
    );
  }

  const myReviews = reviews.filter((r) => r.targetId === c.id);
  const firstGig = gigs.find((g) => g.creatorId === c.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8">
      <Link
        href={role ? "/dashboard/discover" : "/"}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="flex flex-wrap items-start gap-5">
        <Avatar name={c.name} hue={c.avatarHue} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-3xl font-semibold">{c.name}</h1>
            <TierBadge tier={c.tier} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
            @{c.handle}
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.location}</span>
            <StatusDot status={c.status} />
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">{c.bio}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.niches.map((n) => <Badge key={n}>{n}</Badge>)}
          </div>
        </div>
        {role === "company" && (
          <Button asChild>
            <Link href={firstGig ? `/gig/${firstGig.id}` : "/dashboard/messages"}>
              <MessageSquare className="h-4 w-4" /> Start a conversation
            </Link>
          </Button>
        )}
      </div>

      {/* Stats strip */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Base rate", value: formatMoney(c.baseRateCents) },
          { label: "Capacity", value: `${c.capacityPerWeek}/wk` },
          { label: "Completed gigs", value: String(c.completedGigs) },
          { label: "Usage upcharge", value: `+${c.usageUpchargePct}%` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary">{s.label}</p>
              <p className="num mt-0.5 text-xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platforms */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {c.platforms.map((p) => (
          <Card key={p.platform}>
            <CardContent className="flex items-center justify-between p-4">
              <span className="flex items-center gap-2 text-sm font-medium">
                <PlatformIcon platform={p.platform} />
                {PLATFORM_LABELS[p.platform]}
              </span>
              <span className="num text-sm font-semibold">{formatCompact(p.followerCount)} followers</span>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <span className="text-sm text-text-secondary">Compensation</span>
            <Badge variant="money">{COMPENSATION_LABELS[c.compensationPref]}</Badge>
          </CardContent>
        </Card>
        {c.mediaKitUrl && (
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <span className="flex items-center gap-2 text-sm text-text-secondary">
                <FileText className="h-4 w-4" /> Media kit
              </span>
              <Button variant="outline" size="sm">Download PDF</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Portfolio */}
      <h2 className="mt-10 font-serif text-xl font-semibold">Portfolio</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {c.portfolio.map((p) => (
          <div key={p.id}>
            <div
              className="flex aspect-[9/12] items-end rounded-[10px] border border-border p-2"
              style={{
                background: `linear-gradient(160deg, hsl(${p.thumbnailHue} 35% 88%), hsl(${(p.thumbnailHue + 50) % 360} 30% 74%))`,
              }}
            >
              {p.durationSec && (
                <span className="num rounded bg-text-primary/75 px-1.5 py-0.5 text-[10px] text-bg">
                  0:{String(p.durationSec).padStart(2, "0")}
                </span>
              )}
            </div>
            <p className="mt-1.5 line-clamp-1 text-xs text-text-secondary">{p.title}</p>
          </div>
        ))}
      </div>

      {/* Reviews */}
      <div className="mt-10 flex items-center gap-3">
        <h2 className="font-serif text-xl font-semibold">Reviews</h2>
        <StarRating rating={c.rating} count={c.reviewCount} size="md" />
      </div>
      <div className="mt-4 space-y-3">
        {myReviews.length === 0 ? (
          <p className="text-sm text-text-tertiary">
            Reviews unlock after a completed gig — be the first brand to work with {c.name.split(" ")[0]} here.
          </p>
        ) : (
          myReviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{companyById(r.authorId)?.name ?? "Brand"}</p>
                  <StarRating rating={r.rating} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{r.body}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
