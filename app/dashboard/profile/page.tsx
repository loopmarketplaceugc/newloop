"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Save } from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Avatar } from "@/components/ui/avatar";
import { CardSkeleton } from "@/components/ui/skeleton";
import { TierBadge } from "@/components/shared/tier-badge";
import { StatusDot } from "@/components/shared/status-dot";
import { toast } from "@/components/ui/toast";
import { NICHES, type CreatorStatus, type Niche, COMPENSATION_LABELS, type CompensationPref } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const creators = useApp((s) => s.creators);
  const updateCreator = useApp((s) => s.updateCreator);
  const me = creators.find((c) => c.id === userId);

  const [draftBio, setDraftBio] = useState<string | null>(null);
  const [draftRate, setDraftRate] = useState<number | null>(null);

  if (!hydrated || !me) return <CardSkeleton />;

  const save = () => {
    updateCreator(me.id, {
      ...(draftBio !== null ? { bio: draftBio } : {}),
      ...(draftRate !== null ? { baseRateCents: draftRate * 100 } : {}),
    });
    toast("Profile saved", { body: "Brands see your changes immediately.", tone: "success" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Profile</h1>
          <p className="mt-0.5 text-sm text-text-secondary">What brands see on Discover and your public page.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/creator/${me.handle}`}>
            <ExternalLink className="h-4 w-4" /> View public page
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Avatar name={me.name} hue={me.avatarHue} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-xl font-semibold">{me.name}</h2>
              <TierBadge tier={me.tier} />
            </div>
            <p className="text-sm text-text-secondary">@{me.handle} · {me.location}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusDot status={me.status} />
            <div className="flex gap-1">
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

      <div className="grid gap-4 md:grid-cols-2">
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
    </div>
  );
}
