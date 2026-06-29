"use client";

import { useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { authHeaders } from "@/lib/sync";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "Give me 3 hooks for my next video",
  "Turn my last post into a brand pitch",
  "Script a 30s testimonial",
  "What's trending in my niche?",
];

/**
 * Creator Idea Studio — an AI brainstorming chat embedded on the dashboard.
 * Helps creators come up with hooks, content angles, and scripts.
 */
export function IdeaChat({ niches, platforms }: { niches?: string[]; platforms?: string[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ask = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    haptics.select();
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    try {
      const res = await fetch("/api/creator-ideas", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ messages: next, niches, platforms }),
      });
      const body = (await res.json()) as { reply?: string; error?: string };
      const reply = body.reply ?? "I couldn't generate that — try rephrasing.";
      haptics.message();
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Network hiccup — try that again in a sec." },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }));
    }
  };

  return (
    <Card className="flex h-full flex-col border-ink bg-ink text-[#faf6ef] md:col-span-3">
      <CardContent className="flex h-full flex-col">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-serif text-lg font-extrabold text-[#f2a3df]">
            <Sparkles className="h-5 w-5 text-[#a8d98a]" /> Idea Studio
          </p>
          <span className="sticker bg-[#a8d98a] text-[11px] text-ink">scripts &amp; ideas</span>
        </div>

        <div
          ref={scrollRef}
          className="mt-4 min-h-[180px] flex-1 space-y-3 overflow-y-auto pr-1"
        >
          {messages.length === 0 ? (
            <div>
              <p className="text-sm font-bold leading-relaxed text-[#faf6ef]/55">
                Stuck on what to post? Brainstorm hooks, angles, and scripts that turn into brand
                deals. Ask me anything.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="rounded-full border-2 border-[#faf6ef]/20 px-3.5 py-1.5 text-xs font-bold text-[#faf6ef]/80 transition-colors hover:border-[#a8d98a] hover:text-[#a8d98a] cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-[14px] px-3.5 py-2.5 text-[13px] leading-relaxed",
                    m.role === "user"
                      ? "bg-[#f2a3df] font-bold text-ink"
                      : "border-2 border-[#faf6ef]/15 bg-[#faf6ef]/[0.04] text-[#faf6ef]/90",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {busy && (
            <div className="flex items-center gap-2 text-xs font-bold text-[#faf6ef]/50">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> thinking…
            </div>
          )}
        </div>

        <div className="mt-4 flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => {
              haptics.tap();
              setDraft(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void ask(draft);
              }
            }}
            rows={1}
            placeholder="Ask for hooks, angles, or a script…"
            className="max-h-28 min-h-10 flex-1 resize-none rounded-[14px] border-2 border-[#faf6ef]/20 bg-transparent px-3.5 py-2.5 text-[13px] font-medium text-[#faf6ef] placeholder:text-[#faf6ef]/30 focus:border-[#a8d98a] focus:outline-none"
          />
          <button
            onClick={() => void ask(draft)}
            disabled={busy || !draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#a8d98a] text-ink transition-transform hover:scale-105 disabled:opacity-40 cursor-pointer"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
