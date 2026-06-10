import { PLATFORM_LABELS, type Platform } from "@/lib/types";
import { TikTokLogo, InstagramLogo, YouTubeLogo } from "./brand-logos";
import { cn } from "@/lib/utils";

const icons: Record<Platform, typeof TikTokLogo> = {
  tiktok: TikTokLogo,
  reels: InstagramLogo,
  shorts: YouTubeLogo,
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
