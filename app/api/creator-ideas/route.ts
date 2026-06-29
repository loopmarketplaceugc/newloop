import { NextResponse } from "next/server";
import { z } from "zod";
import { authedUserId } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Creator-facing ideas & scripts assistant. Brainstorms hooks, content angles,
 * and short scripts for UGC creators. Uses Anthropic when ANTHROPIC_API_KEY is
 * set; otherwise returns a structured, genuinely useful mock so the chat always
 * works in the demo.
 */

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
  niches: z.array(z.string()).max(12).optional(),
  platforms: z.array(z.string()).max(6).optional(),
});

const SYSTEM = `You are the Loop Idea Studio — a sharp, encouraging creative partner for UGC creators.
You help them brainstorm video hooks, content angles, and tight scripts that land brand deals.
Be concrete and punchy. Prefer short, scroll-stopping hooks and 3-beat scripts (HOOK / BODY / CTA).
Keep replies under ~180 words. Use the creator's niches and platforms when given. Never invent fake stats.`;

function mockReply(lastUser: string, niches: string[], platforms: string[]): string {
  const niche = niches[0] ?? "your niche";
  const platform = platforms[0] ?? "TikTok";
  const topic = lastUser.trim().slice(0, 80) || `${niche} content`;
  return [
    `Here are 3 angles for "${topic}" on ${platform}:`,
    "",
    `1. Myth-bust — "Everyone in ${niche} tells you X. Here's why that's wrong." (Hook lands in the first 2s.)`,
    `2. POV demo — film the product solving one specific problem, no intro, cut every 2–3s.`,
    `3. Before/after — open on the messy "before", reveal the result, then the product.`,
    "",
    `Quick script you can shoot today:`,
    `• HOOK (0–3s): "Stop scrolling if you've ever struggled with ${niche}."`,
    `• BODY (3–25s): show it in real use, react genuinely, name the one differentiator.`,
    `• CTA (25–30s): "It lives in my bag now — link's right here."`,
    "",
    `Want me to tailor these to a specific brand or product?`,
  ].join("\n");
}

async function llmReply(
  messages: { role: "user" | "assistant"; content: string }[],
  context: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      system: `${SYSTEM}\n${context}`,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`LLM API error ${res.status}`);
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const text = data.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Empty LLM response");
  return text;
}

export async function POST(req: Request) {
  // Authenticated creators only — this calls a paid LLM, so it can't be open.
  const callerId = await authedUserId(req);
  if (!callerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = rateLimit(`ideas:${callerId}`, 20, 5 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "You're sending ideas too fast — take a breath and try again." },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { messages, niches = [], platforms = [] } = parsed.data;
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const context = [
    niches.length ? `Creator niches: ${niches.join(", ")}.` : "",
    platforms.length ? `Platforms: ${platforms.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const reply = await llmReply(messages, context, apiKey);
      return NextResponse.json({ reply, source: "llm" });
    } catch {
      // fall through to mock
    }
  }
  await new Promise((r) => setTimeout(r, 600));
  return NextResponse.json({ reply: mockReply(lastUser, niches, platforms), source: "mock" });
}
