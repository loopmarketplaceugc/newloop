import { NextResponse } from "next/server";
import { z } from "zod";
import type { ScriptBlock, ScriptOutput } from "@/lib/types";

const requestSchema = z.object({
  productName: z.string().min(1).max(200),
  productDescription: z.string().max(2000).default(""),
  audience: z.string().max(500).default(""),
  tone: z.enum(["chaotic", "aesthetic", "educational", "testimonial"]),
  platform: z.enum(["tiktok", "reels", "shorts"]),
  kind: z.enum(["script", "brief"]),
  regenerateHookOnly: z.boolean().optional(),
});

const outputSchema = z.object({
  kind: z.enum(["script", "brief"]),
  title: z.string(),
  blocks: z
    .array(
      z.object({
        start: z.string(),
        end: z.string(),
        label: z.enum(["HOOK", "BODY", "CTA"]),
        text: z.string(),
      }),
    )
    .optional(),
  bullets: z.array(z.string()).optional(),
});

const PROMPT = (i: z.infer<typeof requestSchema>) =>
  `You are a direct-response UGC copywriter. Write a high-retention ${i.platform} ${
    i.kind === "script" ? "script" : "creative brief"
  } for ${i.productName} targeting ${i.audience || "a broad social audience"} in a ${i.tone} tone.
Product context: ${i.productDescription || "n/a"}.
${
  i.kind === "script"
    ? `Return STRICT JSON: {"kind":"script","title":string,"blocks":[{"start":"0:00","end":"0:03","label":"HOOK","text":string},{"start":"0:03","end":"0:25","label":"BODY","text":string},{"start":"0:25","end":"0:30","label":"CTA","text":string}]}. Include filming directions in parentheses.`
    : `Return STRICT JSON: {"kind":"brief","title":string,"bullets":[5-8 directive strings covering shot ideas, must-mention points, and the CTA]}.`
} Return ONLY the JSON object, no markdown fences.`;

/* ---------- typed mock (used when no API key is present — UI works either way) ---------- */

const hooksByTone = {
  chaotic: (p: string) => `STOP scrolling — I need to talk about ${p} for exactly 30 seconds. (Grab camera, walk fast, slightly unhinged energy.)`,
  aesthetic: (p: string) => `POV: ${p} just made your whole routine feel intentional. (Slow macro shot, natural light, soft focus pull.)`,
  educational: (p: string) => `Three things nobody tells you about ${p} — number two saves you money. (Hold product to camera, count on fingers.)`,
  testimonial: (p: string) => `I've used ${p} every day for two weeks. Here's my honest take. (Sit-down, eye contact, no music yet.)`,
} as const;

function mockOutput(i: z.infer<typeof requestSchema>): ScriptOutput {
  const audience = i.audience || "your audience";
  if (i.kind === "brief") {
    return {
      kind: "brief",
      title: `${i.productName} — ${i.tone} brief`,
      bullets: [
        `Open on the strongest visual of ${i.productName} in real use — no logo card, no intro`,
        `Speak directly to ${audience}; mirror one pain point in the first 5 seconds`,
        `Must-mention: the single differentiating claim from the product description (say it once, show it twice)`,
        `Shoot one ${i.tone} b-roll moment that would work with the sound off`,
        `Keep total runtime under 35s for ${i.platform === "shorts" ? "Shorts" : i.platform === "reels" ? "Reels" : "TikTok"} retention`,
        `Include one native-feeling imperfection (handheld move, real lighting) — polish kills trust`,
        `CTA: possessive and casual ("it lives in my bag now"), never "buy now"`,
      ],
    };
  }
  const blocks: ScriptBlock[] = [
    { start: "0:00", end: "0:03", label: "HOOK", text: hooksByTone[i.tone](i.productName) },
    {
      start: "0:03",
      end: "0:25",
      label: "BODY",
      text: `Show ${i.productName} doing the one thing ${audience} actually cares about. ${
        i.productDescription
          ? `Work in the key claim naturally: "${i.productDescription.slice(0, 90)}". `
          : ""
      }Demo, don't describe — cut every 2–3 seconds, keep hands in frame, and react to the product in real time. One specific number or comparison beats three adjectives.`,
    },
    {
      start: "0:25",
      end: "0:30",
      label: "CTA",
      text: `Land the ${i.tone === "testimonial" ? "verdict" : "payoff"} in one sentence, then point to where to get it. (End frame: product in use, not packshot. Link sticker bottom-third.)`,
    },
  ];
  return { kind: "script", title: `${i.productName} — ${i.tone} ${i.platform} script`, blocks };
}

/* ---------- LLM call (Anthropic), defensive JSON parsing ---------- */

async function llmOutput(i: z.infer<typeof requestSchema>, apiKey: string): Promise<ScriptOutput> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: PROMPT(i) }],
    }),
  });
  if (!res.ok) throw new Error(`LLM API error ${res.status}`);
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const text = data.content.find((b) => b.type === "text")?.text ?? "";
  // Parse defensively: strip fences, find the outermost JSON object
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in LLM response");
  const parsed = outputSchema.safeParse(JSON.parse(cleaned.slice(start, end + 1)));
  if (!parsed.success) throw new Error("LLM JSON failed schema validation");
  return parsed.data as ScriptOutput;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const output = await llmOutput(parsed.data, apiKey);
      return NextResponse.json({ output, source: "llm" });
    } catch {
      // fall through to mock so the UI always works
    }
  }
  // Simulate generation latency so streaming UI states are visible in the demo
  await new Promise((r) => setTimeout(r, 900));
  return NextResponse.json({ output: mockOutput(parsed.data), source: "mock" });
}
