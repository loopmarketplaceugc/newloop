import { Music2, Clapperboard, PlaySquare, type LucideIcon } from "lucide-react";
import { PLATFORM_LABELS, type Platform } from "@/lib/types";
import { cn } from "@/lib/utils";

const icons: Record<Platform, LucideIcon> = {
  tiktok: Music2,
  reels: Clapperboard,
  shorts: PlaySquare,
};

export function PlatformIcon({
  platform,
  className,
  withLabel,
}: {
  platform: Platform;
  className?: string;
  withLabel?: boolean;
}) {
  const Icon = icons[platform];
  if (!withLabel) return <Icon className={cn("h-4 w-4 text-text-secondary", className)} />;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-text-secondary", className)}>
      <Icon className="h-4 w-4" />
      <span className="text-xs">{PLATFORM_LABELS[platform]}</span>
    </span>
  );
}
