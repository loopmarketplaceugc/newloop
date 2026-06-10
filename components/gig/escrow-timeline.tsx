import { Check, Circle } from "lucide-react";
import { mainPath, STATUS_LABELS } from "@/lib/gig-machine";
import { cn } from "@/lib/utils";
import type { Gig } from "@/lib/types";

export function EscrowTimeline({ gig }: { gig: Gig }) {
  const steps = mainPath(gig.physicalProduct);
  const currentIndex = Math.max(0, steps.indexOf(gig.status));

  return (
    <div className="space-y-3">
      {steps.map((status, index) => {
        const done = index <= currentIndex || gig.status === "COMPLETED";
        const current = status === gig.status;
        return (
          <div key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[11px]",
                  done
                    ? "border-money bg-money text-white"
                    : "border-border bg-surface-2 text-text-tertiary",
                  current && "ring-2 ring-money/20",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
              </span>
              {index < steps.length - 1 ? (
                <span className={cn("h-7 w-px", done ? "bg-money/40" : "bg-border")} />
              ) : null}
            </div>
            <div className="pt-0.5">
              <p className={cn("text-sm font-medium", current ? "text-text-primary" : "text-text-secondary")}>
                {STATUS_LABELS[status]}
              </p>
              <p className="text-xs text-text-tertiary">
                {status === "FUNDED_IN_ESCROW"
                  ? "Brand funds the gig before production starts."
                  : status === "APPROVED"
                    ? "Approval unlocks payout and original deliverables."
                    : status === "COMPLETED"
                      ? "MCC fee is deducted and creator payout is released."
                      : "Tracked automatically in the shared workspace."}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
