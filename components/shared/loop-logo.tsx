export function LoopMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 28" fill="none" className={className} aria-hidden="true">
      <path
        d="M30 4 H12 Q4 4 4 14 Q4 24 12 24 H30"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LoopWordmark({ className }: { className?: string }) {
  return (
    <span className={className} style={{ fontFamily: "serif", fontWeight: 900, letterSpacing: "-0.02em" }}>
      loop
    </span>
  );
}
