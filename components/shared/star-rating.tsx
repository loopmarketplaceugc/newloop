import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  size = "sm",
  className,
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Star
        className={cn(
          "fill-amber text-amber",
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
        )}
      />
      <span className={cn("num font-medium", size === "sm" ? "text-xs" : "text-sm")}>
        {rating.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className="num text-xs text-text-tertiary">({count})</span>
      )}
    </span>
  );
}

/** Interactive star picker for the review flow. */
export function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="rounded p-0.5 cursor-pointer"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              n <= value ? "fill-amber text-amber" : "text-border-bright",
            )}
          />
        </button>
      ))}
    </div>
  );
}
