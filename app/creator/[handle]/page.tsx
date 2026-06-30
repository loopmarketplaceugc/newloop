"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, MapPin, MessageSquare } from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ReachBadge } from "@/components/shared/reach-badge";
import { ChannelBento } from "@/components/creator/channel-bento";
import { StatusDot } from "@/components/shared/status-dot";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { StarRating } from "@/components/shared/star-rating";
import { QrCode } from "@/components/shared/qr-code";
import { COMPENSATION_LABELS, PLATFORM_LABELS } from "@/lib/types";
import { companyById } from "@/lib/seed";
import { dbCreateGig, fetchCreatorByHandle } from "@/lib/sync";
import { formatCompact, formatMoney } from "@/lib/format";
import { toast } from "@/components/ui/toast";
import type { Creator } from "@/lib/types";

export default function CreatorPublicPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);
  const router = useRouter();
  const hydrated = useHydrated();
  const role = useSession((s) => s.role);
  const userId = useSession((s) => s.userId);
  const isDemo = useSession((s) => s.isDemo);
  const { creators, reviews, gigs } = useApp();
  const [starting, setStarting] = useState(false);
  const [fetched, setFetched] = useState<Creator | null | "loading">("loading");
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  const key = decodeURIComponent(handle);
  const fromStore = creators.find((x) => x.handle === key || x.loopTag === key);

  // Fetch from Supabase when not in the local store — makes QR scan work for any visitor.
  useEffect(() => {
    if (fromStore) return;
    let cancelled = false;
    void fetchCreatorByHandle(key).then((c) => {
      if (!cancelled) setFetched(c ?? null);
    });
    return () => { cancelled = true; };
  }, [key, fromStore]);

  const c = fromStore ?? (fetched === "loading" ? null : fetched);
  const loading = !fromStore && fetched === "loading";

  if (!hydrated || loading) {
    return <div className="mx-auto max-w-3xl p-6"><CardSkeleton /></div>;
  }

  if (!c) {
    const notFoundBackHref = role === "company" ? "/dashboard/discover" : role === "creator" ? "/dashboard" : "/";
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-5">
        <p className="font-serif text-2xl font-semibold">Creator not found</p>
        <Button asChild variant="outline"><Link href={notFoundBackHref}>Back</Link></Button>
      </div>
    );
  }

  // Use the loopTag QR link if available, otherwise handle
  const profileUrl = `${origin}/creator/${c.loopTag ?? c.handle}`;
  const isOwnProfile = userId === c.id;

  const myReviews = reviews.filter((r) => r.targetId === c.id);
  const firstGig = gigs.find((g) => g.creatorId === c.id && (!userId || g.companyId === userId));

  const startConversation = async () => {
    if (!userId) {
      router.push("/signup?role=company");
      return;
    }
    if (firstGig) {
      router.push(`/gig/${firstGig.id}`);
      return;
    }
    if (isDemo) {
      router.push("/dashboard/messages");
      return;
    }

    setStarting(true);
    const created = await dbCreateGig(c.id, c.name);
    if (created) {
      useApp.getState().upsertGig(created);
      router.push(`/gig/${created.id}`);
      return;
    }
    setStarting(false);
    toast("Could not open chat", {
      body: "Make sure your brand profile is finished, then try again.",
      tone: "warning",
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6">
      <Link
        href={role === "company" ? "/dashboard/discover" : role === "creator" ? "/dashboard" : "/"}
        className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-surface px-5 py-2.5 text-sm font-bold text-ink shadow-[2px_2px_0_0_#101805] transition-all hover:-translate-y-0.5 hover:bg-ink hover:text-bg"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start gap-5">
        <Avatar name={c.name} hue={c.avatarHue} src={c.avatarUrl} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-3xl font-semibold">{c.name}</h1>
            <ReachBadge platforms={c.platforms} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
            {c.handle && <span>@{c.handle}</span>}
            {c.location && (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.location}</span>
            )}
            <StatusDot status={c.status} />
          </p>
          {c.bio && (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">{c.bio}</p>
          )}
          {c.niches.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.niches.map((n) => <Badge key={n}>{n}</Badge>)}
            </div>
          )}
        </div>
        {role === "company" && !isOwnProfile && (
          <Button onClick={startConversation} disabled={starting}>
            <MessageSquare className="h-4 w-4" /> {starting ? "Opening chat..." : "Start a conversation"}
          </Button>
        )}
      </div>

      {/* Loop tag + QR — shown to everyone, especially useful for brands scanning creator's code */}
      {c.loopTag && (
        <div className="mt-6 flex flex-col gap-4 rounded-[20px] border-2 border-ink bg-surface p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-tertiary">Loop creator tag</p>
            <p className="num mt-1 font-serif text-2xl font-extrabold">{c.loopTag}</p>
            <p className="mt-1.5 text-xs font-medium text-text-secondary">
              Scan to open this profile instantly — verified reach, platforms, and portfolio in one tap.
            </p>
          </div>
          <QrCode value={profileUrl} size={110} label={`QR for ${c.name}`} />
        </div>
      )}

      {/* Stats strip — only show when there's meaningful data */}
      {(c.baseRateCents > 0 || c.completedGigs > 0) && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            c.baseRateCents > 0 && { label: "Base rate", value: formatMoney(c.baseRateCents) },
            { label: "Capacity", value: `${c.capacityPerWeek}/wk` },
            { label: "Completed gigs", value: String(c.completedGigs) },
            c.usageUpchargePct > 0 && { label: "Usage upcharge", value: `+${c.usageUpchargePct}%` },
          ]
            .filter(Boolean)
            .map((s) => (
              <Card key={(s as { label: string }).label}>
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase tracking-wider text-text-tertiary">{(s as { label: string }).label}</p>
                  <p className="num mt-0.5 text-xl font-semibold">{(s as { value: string }).value}</p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Platforms */}
      {c.platforms.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {c.platforms.map((p) => (
            <Card key={p.platform}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <PlatformIcon platform={p.platform} />
                    {PLATFORM_LABELS[p.platform]}
                  </span>
                  <span className="num text-sm font-semibold">{formatCompact(p.followerCount)} followers</span>
                </div>
                {(p.postCount || p.averageViews || p.url) && (
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-text-tertiary">
                    {p.postCount ? <span className="num">{formatCompact(p.postCount)} posts</span> : null}
                    {p.averageViews ? <span className="num">{formatCompact(p.averageViews)} avg views</span> : null}
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noreferrer" className="text-[#d6409f] underline underline-offset-2">
                        open profile
                      </a>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {c.compensationPref && (
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <span className="text-sm text-text-secondary">Compensation</span>
                <Badge variant="money">{COMPENSATION_LABELS[c.compensationPref]}</Badge>
              </CardContent>
            </Card>
          )}
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
      )}

      {/* Portfolio */}
      {c.portfolio.length > 0 && (
        <>
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
        </>
      )}

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

        {/* Right rail — channel bento with platform switcher + profile links */}
        <aside className="mt-8 space-y-4 lg:mt-0 lg:sticky lg:top-6">
          <ChannelBento platforms={c.platforms} />
        </aside>
      </div>
    </div>
  );
}
