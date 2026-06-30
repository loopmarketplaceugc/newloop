"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { TikTokLogo, InstagramLogo, YouTubeLogo } from "@/components/shared/brand-logos";
import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Platform } from "@/lib/types";

interface ChannelPlatform {
  platform: Platform;
  url?: string;
  followerCount: number;
  postCount?: number;
  averageViews?: number;
}

const META: Record<Platform, { label: string; Logo: typeof TikTokLogo; tint: string; cta: string }> = {
  tiktok: { label: "TikTok", Logo: TikTokLogo, tint: "#f2a3df", cta: "Watch on TikTok" },
  reels: { label: "Instagram", Logo: InstagramLogo, tint: "#a8d98a", cta: "View on Instagram" },
  shorts: { label: "YouTube", Logo: YouTubeLogo, tint: "#faf6ef", cta: "Watch on YouTube" },
};

/** Best-effort @handle pulled from a profile URL, for display in the panel. */
function handleFromUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const seg = u.pathname.split("/").filter(Boolean)[0];
    if (!seg) return u.hostname.replace(/^www\./, "");
    return seg.startsWith("@") ? seg : `@${seg.replace(/^@/, "")}`;
  } catch {
    return null;
  }
}

/**
 * Right-rail "bento" that lets a brand flip between a creator's TikTok,
 * Instagram, and YouTube channels and open each profile directly. Profile feeds
 * can't be iframed (the platforms block framing), so each panel is a branded
 * preview that links out to the live profile.
 */
export function ChannelBento({ platforms }: { platforms: ChannelPlatform[] }) {
  const [active, setActive] = useState(0);
  if (platforms.length === 0) return null;

  const p = platforms[Math.min(active, platforms.length - 1)];
  const meta = META[p.platform];
  const handle = handleFromUrl(p.url);

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-tertiary">Channels</p>

      {/* Platform switcher */}
      <div className="flex gap-2">
        {platforms.map((pl, i) => {
          const m = META[pl.platform];
          const on = i === active;
          return (
            <button
              key={pl.platform}
              type="button"
              onClick={() => setActive(i)}
              aria-label={m.label}
              aria-pressed={on}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-[14px] border-2 transition-all cursor-pointer",
                on
                  ? "border-ink shadow-[2px_2px_0_0_#101805]"
                  : "border-border text-text-secondary hover:border-ink/40",
              )}
              style={on ? { background: m.tint } : undefined}
            >
              <m.Logo className="h-5 w-5" />
            </button>
          );
        })}
      </div>

      {/* Active channel preview — branded, links to the live profile */}
      <div className="overflow-hidden rounded-[20px] border-2 border-ink bg-surface">
        <div
          className="flex aspect-[4/5] flex-col items-center justify-center gap-3 p-6 text-center"
          style={{ background: `linear-gradient(160deg, ${meta.tint}, ${meta.tint}22)` }}
        >
          <meta.Logo className="h-14 w-14" />
          <div>
            <p className="font-serif text-lg font-extrabold text-ink">{meta.label}</p>
            {handle && <p className="num text-sm font-bold text-ink/70">{handle}</p>}
          </div>
          {p.url ? (
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-bg transition-transform hover:scale-[1.03]"
            >
              {meta.cta} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="rounded-full border border-ink/20 px-4 py-2 text-[12px] font-bold text-ink/50">
              No profile link yet
            </span>
          )}
        </div>
      </div>

      {/* Stat bento */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[14px] border border-border bg-surface p-3">
          <p className="num text-lg font-extrabold">{formatCompact(p.followerCount)}</p>
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary">followers</p>
        </div>
        <div className="rounded-[14px] border border-border bg-surface p-3">
          <p className="num text-lg font-extrabold">{p.averageViews ? formatCompact(p.averageViews) : "—"}</p>
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary">avg views</p>
        </div>
      </div>
    </div>
  );
}
