import type { CreatorStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const labels: Record<CreatorStatus, string> = {
  open: "Open to Work",
  busy: "Fully Booked",
  away: "Away",
};

/** "Open to Work" gets the pulsing green dot — the only always-on color on a creator card. */
export function StatusDot({
  status,
  withLabel = true,
  className,
}: {
  status: CreatorStatus;
  withLabel?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          status === "open" && "bg-money animate-pulse-dot",
          status === "busy" && "bg-amber",
          status === "away" && "bg-border-bright",
        )}
      />
      {withLabel && (
        <span
          className={cn(
            "text-xs font-medium",
            status === "open" ? "text-money" : "text-text-tertiary",
          )}
        >
          {labels[status]}
        </span>
      )}
    </span>
  );
}
