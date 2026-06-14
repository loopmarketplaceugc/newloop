import { cn } from "@/lib/utils";

const BAR_COLORS = ["#f2a3df", "#a8d98a", "#d6409f", "#a8d98a", "#f2a3df"];

/** Branded equalizer-bar loader. Inline by default, or full-screen overlay. */
export function Loader({
  label = "Loading",
  fullScreen = false,
  className,
}: {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}) {
  const inner = (
    <div className={cn("flex flex-col items-center gap-5", className)}>
      <div className="loader-bars">
        {BAR_COLORS.map((c, i) => (
          <span key={i} style={{ background: c, animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
      <p className="font-serif text-sm font-extrabold uppercase tracking-[0.25em] text-text-tertiary">
        {label}
        <span className="animate-pulse">…</span>
      </p>
    </div>
  );

  if (!fullScreen) return inner;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-7 bg-bg">
      <span className="font-serif text-5xl font-extrabold tracking-tight text-ink">
        MCC<span className="align-super text-base text-[#d6409f]">®</span>
      </span>
      {inner}
    </div>
  );
}

/** Small inline spinner ring for buttons / tight spots. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin-slow rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      aria-hidden="true"
    />
  );
}
