/**
 * Lightweight in-memory fixed-window rate limiter.
 *
 * NOTE: this is per-server-instance. On a single long-lived Node server it is a
 * solid baseline; on horizontally-scaled / serverless deploys each instance has
 * its own window, so for hard global limits move this to Redis/Upstash. It still
 * meaningfully blunts abuse from a single client hammering one instance.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map can't grow unbounded.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * @param key      caller identity (ip, user id, or `${route}:${ip}`)
 * @param limit    max requests per window
 * @param windowMs window length in ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  existing.count += 1;
  const ok = existing.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/** Best-effort client IP from common proxy headers. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
