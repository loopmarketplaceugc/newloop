import { PlatformIcon } from "@/components/shared/platform-icon";
import { formatCompact } from "@/lib/format";
import type { PlatformPresence } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Identity reach summary — total followers across platforms plus the platform
 * icons, shown next to a creator's name.
 */
export function ReachBadge({
  platforms,
  showIcons = true,
  className,
}: {
  platforms: PlatformPresence[];
  showIcons?: boolean;
  className?: string;
}) {
  const total = platforms.reduce((sum, p) => sum + p.followerCount, 0);
  if (total === 0 && platforms.length === 0) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {total > 0 && (
        <span className="num text-xs font-semibold text-text-secondary">
          {formatCompact(total)} followers
        </span>
      )}
      {showIcons && platforms.length > 0 && (
        <span className="flex -space-x-1">
          {platforms.map((p) => (
            <PlatformIcon
              key={p.platform}
              platform={p.platform}
              className="h-4 w-4 border border-surface"
            />
          ))}
        </span>
      )}
    </span>
  );
}
