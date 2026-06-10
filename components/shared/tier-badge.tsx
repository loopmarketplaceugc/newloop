import { Badge } from "@/components/ui/badge";
import { TIER_LABELS, type Tier } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Tier stays monochrome — color is reserved for money and AI. Weight carries rank. */
const tierStyle: Record<Tier, string> = {
  nano: "border-border text-text-tertiary",
  micro: "border-border text-text-secondary",
  mid: "border-border-bright text-text-primary",
  elite: "border-text-primary/30 bg-text-primary text-bg",
};

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <Badge variant="outline" className={cn(tierStyle[tier], className)}>
      {TIER_LABELS[tier]}
    </Badge>
  );
}
