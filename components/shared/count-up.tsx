"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The signature moment: when escrow releases, the earnings figure counts up
 * with a brief green glow pulse. Everything else stays quiet.
 */
export function CountUpMoney({
  cents,
  className,
  durationMs = 900,
}: {
  cents: number;
  className?: string;
  durationMs?: number;
}) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(cents);
  const [glowing, setGlowing] = useState(false);
  const prev = useRef(cents);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (cents === prev.current) return;
    const from = prev.current;
    prev.current = cents;
    if (reduced) {
      setDisplay(cents);
      return;
    }
    const start = performance.now();
    setGlowing(true);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (cents - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else setTimeout(() => setGlowing(false), 400);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [cents, durationMs, reduced]);

  return (
    <span className={cn("num", glowing && "animate-glow-pulse", className)}>
      {formatMoney(display, { showCents: true })}
    </span>
  );
}
