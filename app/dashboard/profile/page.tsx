"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Save } from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Avatar } from "@/components/ui/avatar";
import { CardSkeleton } from "@/components/ui/skeleton";
import { TierBadge } from "@/components/shared/tier-badge";
import { StatusDot } from "@/components/shared/status-dot";
import { TikTokLogo, InstagramLogo, YouTubeLogo } from "@/components/shared/brand-logos";
import { toast } from "@/components/ui/toast";
import { NICHES, type CreatorStatus, type Niche, COMPENSATION_LABELS, type CompensationPref, type Platform } from "@/lib/types";
import { formatCompact, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const PLATFORM_META: Record<Platform, { label: string; Logo: typeof TikTokLogo }> = {
  tiktok: { label: "TikTok", Logo: TikTokLogo },
  reels: { label: "Instagram Reels", Logo: InstagramLogo },
  shorts: { label: "YouTube Shorts", Logo: YouTubeLogo },
};

export default function ProfilePage() {
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const creators = useApp((s) => s.creators);
  const updateCreator = useApp((s) => s.updateCreator);
  const me = creators.find((c) => c.id === userId);

  const [draftBio, setDraftBio] = useState<string | null>(null);
  const [draftRate, setDraftRate] = useState<number | null>(null);
  // Wait a moment before showing the incomplete-onboarding banner to avoid a
  // flash on valid users whose creator data hasn't loaded from the DB yet.
  const [showIncompleteBanner, setShowIncompleteBanner] = useState(false);
  useEffect(() => {
    if (!hydrated || me) { setShowIncompleteBanner(false); return; }
    const t = setTimeout(() => setShowIncompleteBanner(true), 2500);
    return () => clearTimeout(t);
  }, [hydrated, me]);

  if (!hydrated || (!me && !showIncompleteBanner)) return <CardSkeleton />;

  if (!me) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-4xl font-extrabold leading-[0.95] sm:text-5xl">Profile</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <p className="font-serif text-xl font-bold">Your profile isn&apos;t set up yet.</p>
            <p className="max-w-sm text-sm text-text-secondary">
              Finish onboarding to unlock your profile, get discovered by brands, and receive your Loop tag.
            </p>
            <Button asChild>
              <Link href="/onboarding/creator">Complete onboarding →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const save = () => {
    updateCreator(me.id, {
      ...(draftBio !== null ? { bio: draftBio } : {}),
      ...(draftRate !== null ? { baseRateCents: draftRate * 100 } : {}),
    });
    setDraftBio(null);
    setDraftRate(null);
    toast("Profile saved", { body: "Brands see your changes immediately.", tone: "success" });
  };

  const copyTag = () => {
    if (!me.loopTag) return;
    void navigator.clipboard.writeText(me.loopTag);
    toast("Copied", { body: me.loopTag, tone: "success" });
  };

  const totalFollowers = me.platforms.reduce((s, p) => s + p.followerCount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold leading-[0.95]">Profile</h1>
          <p className="mt-2 text-sm font-bold text-text-secondary">What brands see on Discover and your public page.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/creator/${me.handle}`}>
            <ExternalLink className="h-4 w-4" /> View public page
          </Link>
        </Button>
      </div>

      {/* Identity card */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Avatar name={me.name} hue={me.avatarHue} src={me.avatarUrl} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-xl font-semibold">{me.name}</h2>
              <TierBadge tier={me.tier} />
            </div>
            <p className="text-sm text-text-secondary">@{me.handle} · {me.location}</p>
            {me.loopTag ? (
              <button
                onClick={copyTag}
                className="mt-1.5 flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-bold tracking-wider text-text-secondary transition-colors hover:border-border-bright hover:text-text-primary cursor-pointer"
              >
                <span className="num">{me.loopTag}</span>
                <Copy className="h-3 w-3 opacity-50" />
              </button>
            ) : (
              <p className="mt-1 text-[11px] text-text-tertiary">No Loop tag yet — complete onboarding to get one.</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusDot status={me.status} />
            <div className="flex flex-wrap justify-end gap-1">
              {(["open", "busy", "away"] as CreatorStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => updateCreator(me.id, { status: s })}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize transition-colors cursor-pointer",
                    me.status === s ? "border-text-primary bg-surface-2" : "border-border text-text-tertiary hover:border-border-bright",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platforms + followers */}
      {me.platforms.length > 0 && (
        <Card>
          <CardContent>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Platforms</p>
              {totalFollowers > 0 && (
                <span className="text-[11px] font-bold text-text-secondary">
                  <span className="num">{formatCompact(totalFollowers)}</span> total followers
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {me.platforms.map((p) => {
                const meta = PLATFORM_META[p.platform];
                return (
                  <div key={p.platform} className="flex items-center gap-3 rounded-[10px] border border-border bg-bg p-3">
                    <meta.Logo className="h-6 w-6 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold">{meta.label}</p>
                      {p.followerCount > 0 && (
                        <p className="num text-[11px] text-text-tertiary">
                          {formatCompact(p.followerCount)} followers
                        </p>
                      )}
                      {p.averageViews && p.averageViews > 0 ? (
                        <p className="num text-[11px] text-text-tertiary">
                          ~{formatCompact(p.averageViews)} avg views
                        </p>
                      ) : null}
                    </div>
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-text-tertiary hover:text-text-primary"
                        aria-label={`Open ${meta.label}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Bio + niches */}
        <Card>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                className="mt-1.5 min-h-28"
                value={draftBio ?? me.bio}
                onChange={(e) => setDraftBio(e.target.value)}
              />
            </div>
            <div>
              <Label>Niches</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {NICHES.map((n) => {
                  const active = me.niches.includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() =>
                        updateCreator(me.id, {
                          niches: active ? me.niches.filter((x) => x !== n) : [...me.niches, n as Niche],
                        })
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer",
                        active
                          ? "border-text-primary bg-text-primary text-bg"
                          : "border-border text-text-secondary hover:border-border-bright",
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rates + preferences */}
        <Card>
          <CardContent className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <Label>Base rate per video</Label>
                <span className="num text-sm font-semibold">{formatMoney((draftRate ?? me.baseRateCents / 100) * 100)}</span>
              </div>
              <Slider
                className="mt-3"
                min={50}
                max={2000}
                step={25}
                value={[draftRate ?? me.baseRateCents / 100]}
                onValueChange={([v]) => setDraftRate(v)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Weekly capacity</Label>
                <span className="num text-sm font-semibold">{me.capacityPerWeek}/wk ≈ {me.capacityPerWeek * 4}/mo</span>
              </div>
              <Slider
                className="mt-3"
                min={1}
                max={10}
                step={1}
                value={[me.capacityPerWeek]}
                onValueChange={([v]) => updateCreator(me.id, { capacityPerWeek: v })}
              />
            </div>
            <div>
              <Label>Compensation</Label>
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                {(Object.keys(COMPENSATION_LABELS) as CompensationPref[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => updateCreator(me.id, { compensationPref: c })}
                    className={cn(
                      "rounded-[8px] border px-2 py-2 text-[12px] font-medium transition-colors cursor-pointer",
                      me.compensationPref === c
                        ? "border-text-primary bg-surface-2"
                        : "border-border text-text-secondary hover:border-border-bright",
                    )}
                  >
                    {COMPENSATION_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-[13px]">
              <p>
                Usage rights: <span className="num font-semibold">+{me.usageUpchargePct}%</span>
              </p>
              <p>
                Raw footage: <span className="num font-semibold">+{me.rawUpchargePct}%</span>
              </p>
            </div>
            <Button onClick={save} className="w-full">
              <Save className="h-4 w-4" /> Save changes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio */}
      {me.portfolio.length > 0 && (
        <Card>
          <CardContent>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
              Portfolio ({me.portfolio.length})
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {me.portfolio.map((p) => (
                <div key={p.id} className="group">
                  <div
                    className="flex aspect-[9/12] items-end rounded-[10px] border border-border p-2 transition-colors group-hover:border-border-bright"
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
