/**
 * Minimal structured server logger. Centralises error reporting so money-path
 * failures are always observable, and gives a single seam to wire an external
 * tracker (Sentry, Logtail, etc.) later without touching call sites.
 */

type Fields = Record<string, unknown>;

function emit(level: "error" | "warn" | "info", scope: string, message: string, fields?: Fields) {
  const line = { level, scope, message, ts: new Date().toISOString(), ...(fields ?? {}) };
  // Structured single-line JSON — easy to grep and to ship to a log drain.
  const serialized = JSON.stringify(line, (_k, v) => (v instanceof Error ? { name: v.name, message: v.message } : v));
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);

  // Hook point for an external error tracker.
  // if (level === "error" && process.env.SENTRY_DSN) { ...captureException... }
}

export const log = {
  error: (scope: string, message: string, fields?: Fields) => emit("error", scope, message, fields),
  warn: (scope: string, message: string, fields?: Fields) => emit("warn", scope, message, fields),
  info: (scope: string, message: string, fields?: Fields) => emit("info", scope, message, fields),
};
