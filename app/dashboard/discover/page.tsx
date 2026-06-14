"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { CardSkeleton } from "@/components/ui/skeleton";
import { TierBadge } from "@/components/shared/tier-badge";
import { StatusDot } from "@/components/shared/status-dot";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { StarRating } from "@/components/shared/star-rating";
import {
  NICHES,
  PLATFORM_LABELS,
  TIER_LABELS,
  type Niche,
  type Platform,
  type Tier,
} from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function DiscoverPage() {
  const hydrated = useHydrated();
  const creators = useApp((s) => s.creators);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [niche, setNiche] = useState<Niche | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [rate, setRate] = useState<[number, number]>([0, 1500]);
  const [minCapacity, setMinCapacity] = useState(0);
  const [productOk, setProductOk] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(
    () =>
      creators.filter((c) => {
        if (platform && !c.platforms.some((p) => p.platform === platform)) return false;
        if (niche && !c.niches.includes(niche)) return false;
        if (tiers.length && !tiers.includes(c.tier)) return false;
        const rateDollars = c.baseRateCents / 100;
        if (rateDollars < rate[0] || rateDollars > rate[1]) return false;
        if (c.capacityPerWeek < minCapacity) return false;
        if (productOk && c.compensationPref === "paid_only") return false;
        if (c.rating < minRating) return false;
        return true;
      }),
    [creators, platform, niche, tiers, rate, minCapacity, productOk, minRating],
  );

  if (!hydrated) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  const clearAll = () => {
    setPlatform(null);
    setNiche(null);
    setTiers([]);
    setRate([0, 1500]);
    setMinCapacity(0);
    setProductOk(false);
    setMinRating(0);
  };

  const filterRail = (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Platform</p>
        <div className="space-y-1">
          {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(platform === p ? null : p)}
              className={cn(
                "flex w-full items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-[13px] transition-colors cursor-pointer",
                platform === p ? "bg-surface-2 font-medium" : "text-text-secondary hover:bg-surface-2/60",
              )}
            >
              <PlatformIcon platform={p} className="h-3.5 w-3.5" />
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Niche</p>
        <div className="flex flex-wrap gap-1.5">
          {NICHES.map((n) => (
            <button
              key={n}
              onClick={() => setNiche(niche === n ? null : n)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                niche === n
                  ? "border-text-primary bg-text-primary text-bg"
                  : "border-border text-text-secondary hover:border-border-bright",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Tier</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TIER_LABELS) as Tier[]).map((t) => (
            <button
              key={t}
              onClick={() => setTiers(tiers.includes(t) ? tiers.filter((x) => x !== t) : [...tiers, t])}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                tiers.includes(t)
                  ? "border-text-primary bg-text-primary text-bg"
                  : "border-border text-text-secondary hover:border-border-bright",
              )}
            >
              {TIER_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Rate range</p>
          <span className="num text-xs text-text-secondary">
            ${rate[0]}–${rate[1]}{rate[1] >= 1500 ? "+" : ""}
          </span>
        </div>
        <Slider
          min={0}
          max={1500}
          step={25}
          value={rate}
          onValueChange={(v) => setRate(v as [number, number])}
        />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Min capacity</p>
          <span className="num text-xs text-text-secondary">{minCapacity}/wk</span>
        </div>
        <Slider min={0} max={8} step={1} value={[minCapacity]} onValueChange={([v]) => setMinCapacity(v)} />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-secondary">Product exchange OK</p>
        <Switch checked={productOk} onCheckedChange={setProductOk} />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Min rating</p>
          <span className="num text-xs text-text-secondary">{minRating.toFixed(1)}★</span>
        </div>
        <Slider min={0} max={5} step={0.5} value={[minRating]} onValueChange={([v]) => setMinRating(v)} />
      </div>
      <Button variant="ghost" size="sm" className="w-full" onClick={clearAll}>
        Clear all filters
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold leading-[0.95]">Discover creators</h1>
          <p className="mt-2 text-sm font-bold text-text-secondary">
            <span className="num">{filtered.length}</span> of <span className="num">{creators.length}</span> creators ·
            press <kbd className="num rounded border border-border bg-surface-2 px-1 text-[11px]">⌘K</kbd> to search
          </p>
        </div>
        <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(!filtersOpen)}>
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Filter rail */}
        <aside className={cn("w-56 shrink-0", filtersOpen ? "block" : "hidden lg:block")}>
          {filterRail}
        </aside>

        {/* Grid */}
        <div className="min-w-0 flex-1">
          {filtered.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No creators match these filters"
              body="Loosen the rate range or drop a filter — elite-tier creators in narrow niches book out fast."
              action={
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => (
                <Link key={c.id} href={`/creator/${c.handle}`}>
                  <Card interactive className="h-full p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} hue={c.avatarHue} src={c.avatarUrl} size="md" />
                        <div>
                          <p className="text-sm font-semibold">{c.name}</p>
                          <p className="text-xs text-text-tertiary">@{c.handle}</p>
                        </div>
                      </div>
                      <StatusDot status={c.status} withLabel={false} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <TierBadge tier={c.tier} />
                      {c.niches.slice(0, 3).map((n) => (
                        <Badge key={n}>{n}</Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-text-tertiary">From</p>
                        <p className="num text-lg font-semibold">{formatMoney(c.baseRateCents)}</p>
                      </div>
                      <div className="text-right">
                        <StarRating rating={c.rating} count={c.reviewCount} />
                        <p className="num mt-0.5 text-[11px] text-text-tertiary">
                          {c.capacityPerWeek}/wk capacity
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {c.platforms.map((p) => (
                        <PlatformIcon key={p.platform} platform={p.platform} className="h-3.5 w-3.5" />
                      ))}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
