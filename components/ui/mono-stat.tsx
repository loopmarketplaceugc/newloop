import { cn } from "@/lib/utils";

/** Big numeral in Geist Mono with tabular figures — the signature detail. */
export function MonoStat({
  label,
  value,
  sub,
  size = "md",
  accent,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  size?: "sm" | "md" | "lg";
  accent?: "money" | "ai";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
        {label}
      </span>
      <span
        className={cn(
          "num font-semibold",
          size === "sm" && "text-lg",
          size === "md" && "text-2xl",
          size === "lg" && "text-4xl sm:text-5xl",
          accent === "money" ? "text-money" : accent === "ai" ? "text-ai" : "text-text-primary",
        )}
      >
        {value}
      </span>
      {sub ? <span className="text-xs text-text-tertiary">{sub}</span> : null}
    </div>
  );
}
