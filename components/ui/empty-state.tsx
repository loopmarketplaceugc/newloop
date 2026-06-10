import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Every list gets a designed empty state with a clear next action. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed border-border-bright bg-surface-2/50 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface border border-border">
        <Icon className="h-5 w-5 text-text-tertiary" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="mx-auto max-w-xs text-[13px] leading-relaxed text-text-secondary">{body}</p>
      </div>
      {action}
    </div>
  );
}
