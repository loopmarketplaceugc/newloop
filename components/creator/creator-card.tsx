import Link from "next/link";
import { ArrowUpRight, Clock, DollarSign } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { StarRating } from "@/components/shared/star-rating";
import { StatusDot } from "@/components/shared/status-dot";
import { TierBadge } from "@/components/shared/tier-badge";
import { formatCompact, formatMoney } from "@/lib/format";
import type { Creator } from "@/lib/types";

function totalFollowers(creator: Creator) {
  return creator.platforms.reduce((sum, p) => sum + p.followerCount, 0);
}

export function CreatorCard({ creator }: { creator: Creator }) {
  const capacityLeft = Math.max(0, creator.capacityPerWeek - creator.slotsBooked);

  return (
    <Link href={`/creator/${creator.handle}`}>
      <Card interactive className="h-full overflow-hidden">
        <div
          className="h-24 border-b border-border"
          style={{
            background: `linear-gradient(135deg, hsl(${creator.avatarHue} 42% 88%), hsl(${creator.avatarHue + 36} 48% 94%))`,
          }}
        />
        <CardContent className="space-y-4">
          <div className="-mt-12 flex items-end justify-between">
            <Avatar name={creator.name} hue={creator.avatarHue} src={creator.avatarUrl} size="lg" />
            <ArrowUpRight className="mb-1 h-4 w-4 text-text-tertiary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-xl font-semibold">{creator.name}</h3>
              <TierBadge tier={creator.tier} />
            </div>
            <p className="mt-0.5 text-sm text-text-tertiary">@{creator.handle} · {creator.location}</p>
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-text-secondary">{creator.bio}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {creator.niches.slice(0, 3).map((niche) => (
              <Badge key={niche} variant="outline">
                {niche}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-[10px] border border-border bg-bg p-3">
            <div>
              <p className="text-[11px] text-text-tertiary">Rate</p>
              <p className="num mt-0.5 text-sm font-semibold">{formatMoney(creator.baseRateCents)}</p>
            </div>
            <div>
              <p className="text-[11px] text-text-tertiary">Reach</p>
              <p className="num mt-0.5 text-sm font-semibold">{formatCompact(totalFollowers(creator))}</p>
            </div>
            <div>
              <p className="text-[11px] text-text-tertiary">Slots</p>
              <p className="num mt-0.5 text-sm font-semibold">{capacityLeft}/{creator.capacityPerWeek}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <StatusDot status={creator.status} />
            <StarRating rating={creator.rating} count={creator.reviewCount} />
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex -space-x-1.5">
              {creator.platforms.map((platform) => (
                <PlatformIcon key={platform.platform} platform={platform.platform} className="border border-surface" />
              ))}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" /> +{creator.usageUpchargePct}% usage
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {creator.compensationPref.replaceAll("_", " ")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
