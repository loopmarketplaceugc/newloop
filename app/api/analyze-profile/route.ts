import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  platform: z.enum(["tiktok", "reels"]),
  url: z.string().url().max(500),
});

interface ProfileMetrics {
  followerCount: number | null;
  postCount: number | null;
  averageViews: number | null;
  confidence: "high" | "medium" | "low";
  message: string;
}

function validHost(platform: "tiktok" | "reels", url: URL) {
  const host = url.hostname.replace(/^www\./, "");
  if (platform === "tiktok") return host === "tiktok.com" || host.endsWith(".tiktok.com");
  return host === "instagram.com" || host.endsWith(".instagram.com");
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'");
}

function parseCompactNumber(raw: string) {
  const cleaned = raw.trim().replaceAll(",", "");
  const match = cleaned.match(/^(\d+(?:\.\d+)?)([kKmMbB])?$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const suffix = match[2]?.toLowerCase();
  if (suffix === "k") return Math.round(value * 1_000);
  if (suffix === "m") return Math.round(value * 1_000_000);
  if (suffix === "b") return Math.round(value * 1_000_000_000);
  return Math.round(value);
}

function firstNumber(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    const value = parseCompactNumber(match[1]);
    if (value !== null) return value;
  }
  return null;
}

function allNumbers(html: string, patterns: RegExp[]) {
  const values: number[] = [];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      if (!match[1]) continue;
      const value = parseCompactNumber(match[1]);
      if (value !== null && value > 0) values.push(value);
    }
  }
  return Array.from(new Set(values));
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function analyzeTikTok(html: string): ProfileMetrics {
  const decoded = decodeHtml(html);
  const followerCount = firstNumber(decoded, [
    /"followerCount"\s*:\s*(\d+(?:\.\d+)?[kKmMbB]?)/,
    /"fans"\s*:\s*(\d+(?:\.\d+)?[kKmMbB]?)/,
    /([\d,.]+[kKmMbB]?)\s+Followers/i,
  ]);
  const postCount = firstNumber(decoded, [
    /"videoCount"\s*:\s*(\d+(?:\.\d+)?[kKmMbB]?)/,
    /"awemeCount"\s*:\s*(\d+(?:\.\d+)?[kKmMbB]?)/,
    /([\d,.]+[kKmMbB]?)\s+Videos/i,
  ]);
  const plays = allNumbers(decoded, [
    /"playCount"\s*:\s*(\d+(?:\.\d+)?[kKmMbB]?)/g,
    /"play_count"\s*:\s*(\d+(?:\.\d+)?[kKmMbB]?)/g,
  ]).slice(0, 24);
  const averageViews = average(plays);
  const found = [followerCount, postCount, averageViews].filter((v) => v !== null).length;
  return {
    followerCount,
    postCount,
    averageViews,
    confidence: found >= 2 ? "high" : found === 1 ? "medium" : "low",
    message:
      found > 0
        ? "Pulled from the public TikTok profile page."
        : "TikTok did not expose public metrics for this profile. Enter them manually.",
  };
}

function analyzeInstagram(html: string): ProfileMetrics {
  const decoded = decodeHtml(html);
  const followerCount = firstNumber(decoded, [
    /"edge_followed_by"\s*:\s*\{\s*"count"\s*:\s*(\d+)/,
    /"followers_count"\s*:\s*(\d+)/,
    /([\d,.]+[kKmMbB]?)\s+Followers/i,
  ]);
  const postCount = firstNumber(decoded, [
    /"edge_owner_to_timeline_media"\s*:\s*\{\s*"count"\s*:\s*(\d+)/,
    /"media_count"\s*:\s*(\d+)/,
    /([\d,.]+[kKmMbB]?)\s+Posts/i,
  ]);
  const views = allNumbers(decoded, [
    /"video_view_count"\s*:\s*(\d+)/g,
    /"play_count"\s*:\s*(\d+)/g,
    /"view_count"\s*:\s*(\d+)/g,
  ]).slice(0, 24);
  const averageViews = average(views);
  const found = [followerCount, postCount, averageViews].filter((v) => v !== null).length;
  return {
    followerCount,
    postCount,
    averageViews,
    confidence: found >= 2 ? "high" : found === 1 ? "medium" : "low",
    message:
      found > 0
        ? "Pulled from the public Instagram profile page."
        : "Instagram did not expose public metrics for this profile. Enter them manually.",
  };
}

export async function POST(req: Request) {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Send a valid TikTok or Instagram profile URL." }, { status: 400 });
  }

  const url = new URL(parsed.data.url);
  if (!validHost(parsed.data.platform, url)) {
    return NextResponse.json(
      { error: parsed.data.platform === "tiktok" ? "Use a TikTok profile link." : "Use an Instagram profile link." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(url.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(9_000),
      headers: {
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
      },
    });
    if (!res.ok) {
      return NextResponse.json({
        followerCount: null,
        postCount: null,
        averageViews: null,
        confidence: "low",
        message: "That platform blocked the public profile request. Enter the metrics manually.",
      } satisfies ProfileMetrics);
    }
    const html = await res.text();
    return NextResponse.json(
      parsed.data.platform === "tiktok" ? analyzeTikTok(html) : analyzeInstagram(html),
    );
  } catch {
    return NextResponse.json({
      followerCount: null,
      postCount: null,
      averageViews: null,
      confidence: "low",
      message: "Could not reach that public profile. Enter the metrics manually.",
    } satisfies ProfileMetrics);
  }
}
