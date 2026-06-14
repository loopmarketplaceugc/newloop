"use client";

/**
 * Lightweight haptics. Uses the Vibration API (Android Chrome, most Android
 * browsers). iOS Safari ignores navigator.vibrate, so this degrades to a no-op
 * there — never throws, safe to call anywhere.
 *
 * Immersive-by-default: keystrokes, taps, step transitions, and incoming
 * messages all get a tiny buzz so the app feels physical on a phone.
 */

type Pattern = number | number[];

let enabled = true;

function canVibrate(): boolean {
  return (
    enabled &&
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  );
}

export function buzz(pattern: Pattern): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* no-op */
  }
}

/** Named haptic vocabulary so call sites read clearly. */
export const haptics = {
  /** Single keystroke while typing — very light. */
  tap: () => buzz(6),
  /** Selecting a choice / toggling. */
  select: () => buzz(12),
  /** Advancing a step / submitting. */
  step: () => buzz([10, 30, 16]),
  /** Success / account created. */
  success: () => buzz([14, 40, 14, 40, 26]),
  /** Error / invalid. */
  error: () => buzz([40, 30, 40]),
  /** New incoming chat message — a distinct double pulse. */
  message: () => buzz([18, 50, 22]),
  /** Certification / big celebratory moment. */
  celebrate: () => buzz([12, 40, 12, 40, 12, 40, 60]),
};

export function setHapticsEnabled(on: boolean): void {
  enabled = on;
}
