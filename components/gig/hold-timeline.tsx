import { Check, Circle } from "lucide-react";
import { mainPath, STATUS_LABELS } from "@/lib/gig-machine";
import { cn } from "@/lib/utils";
import type { Gig, GigStatus } from "@/lib/types";

const STATUS_DESCRIPTIONS: Partial<Record<GigStatus, string>> = {
  FUNDED_IN_ESCROW: "Brand locks payment before production starts.",
  APPROVED: "Draft approved — the creator publishes next.",
  PUBLISHED: "Creator posted the live link; brand approves to release payment.",
  COMPLETED: "Live post approved — the gig is complete.",
};

export function HoldTimeline({ gig }: { gig: Gig }) {
  const statusSteps = mainPath(gig.physicalProduct);
  const currentIndex = Math.max(0, statusSteps.indexOf(gig.status));
  const isComplete = gig.status === "COMPLETED";

  // Real status steps, plus a final checklist item confirming the payout went out.
  const steps = [
    ...statusSteps.map((status, index) => ({
      key: status as string,
      label: STATUS_LABELS[status],
      description: STATUS_DESCRIPTIONS[status] ?? "Tracked automatically in the shared workspace.",
      done: index <= currentIndex || isComplete,
      current: status === gig.status,
    })),
    {
      key: "PAYMENT_SENT",
      label: "Payment sent to creator",
      description: "Loop releases the creator's payout once the live post is approved.",
      done: isComplete,
      current: false,
    },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.key} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[11px]",
                step.done
                  ? "border-money bg-money text-white"
                  : "border-border bg-surface-2 text-text-tertiary",
                step.current && "ring-2 ring-money/20",
              )}
            >
              {step.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
            </span>
            {index < steps.length - 1 ? (
              <span className={cn("h-7 w-px", step.done ? "bg-money/40" : "bg-border")} />
            ) : null}
          </div>
          <div className="pt-0.5">
            <p className={cn("text-sm font-medium", step.current ? "text-text-primary" : "text-text-secondary")}>
              {step.label}
            </p>
            <p className="text-xs text-text-tertiary">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
