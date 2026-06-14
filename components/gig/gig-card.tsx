import Link from "next/link";
import { CalendarDays, Package, Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { companyById, creatorById } from "@/lib/seed";
import { daysUntil, formatMoney, formatShortDate } from "@/lib/format";
import type { Gig } from "@/lib/types";

export function GigCard({
  gig,
  perspective = "company",
}: {
  gig: Gig;
  perspective?: "creator" | "company";
}) {
  const creator = creatorById(gig.creatorId);
  const company = companyById(gig.companyId);
  const partnerName = perspective === "creator" ? company?.name ?? "Brand" : creator?.name ?? "Creator";
  const partnerHue = perspective === "creator" ? company?.logoHue ?? 20 : creator?.avatarHue ?? 180;
  const partnerAvatarUrl = perspective === "company" ? creator?.avatarUrl : undefined;
  const deadline = gig.deadline ? daysUntil(gig.deadline) : null;

  return (
    <Link href={`/gig/${gig.id}`}>
      <Card interactive className="h-full">
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={partnerName} hue={partnerHue} src={partnerAvatarUrl} size="sm" />
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">{gig.title}</h3>
                <p className="truncate text-xs text-text-tertiary">{partnerName}</p>
              </div>
            </div>
            <StatusPill status={gig.status} />
          </div>

          <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">{gig.brief}</p>

          <div className="grid grid-cols-3 gap-2 rounded-[10px] border border-border bg-bg p-3">
            <div>
              <p className="text-[11px] text-text-tertiary">Payment</p>
              <p className="num mt-0.5 text-sm font-semibold text-money">{formatMoney(gig.priceCents)}</p>
            </div>
            <div>
              <p className="text-[11px] text-text-tertiary">Fee</p>
              <p className="num mt-0.5 text-sm font-semibold">{formatMoney(gig.feeCents)}</p>
            </div>
            <div>
              <p className="text-[11px] text-text-tertiary">Usage</p>
              <p className="num mt-0.5 text-sm font-semibold">{gig.usageDays}d</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            <Badge variant="outline">
              {gig.platform === "tiktok" ? "TikTok" : gig.platform === "reels" ? "Reels" : "Shorts"}
            </Badge>
            {gig.physicalProduct ? (
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                {gig.trackingNumber ? gig.trackingNumber : "Product ship needed"}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Video className="h-3.5 w-3.5" /> Digital brief
              </span>
            )}
            {gig.deadline ? (
              <span className="ml-auto flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {deadline !== null && deadline >= 0 ? `${deadline}d left` : formatShortDate(gig.deadline)}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
