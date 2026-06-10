import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  tone = "default",
}: {
  value: number; // 0–100
  className?: string;
  tone?: "default" | "money" | "ai";
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2 border border-border", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          tone === "money" ? "bg-money" : tone === "ai" ? "bg-ai" : "bg-text-primary",
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
