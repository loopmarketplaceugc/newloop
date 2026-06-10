import { cn } from "@/lib/utils";

/** Every async surface gets a skeleton — no spinners. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-[8px] bg-surface-2", className)}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[10px] border border-border bg-surface p-5 space-y-3", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
