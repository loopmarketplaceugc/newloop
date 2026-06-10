"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Paperclip, RefreshCw, Send, Sparkles, X } from "lucide-react";
import { useApp } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { slideInRight } from "@/lib/motion";
import {
  PLATFORM_LABELS,
  TONE_LABELS,
  type Platform,
  type ScriptDoc,
  type ScriptKind,
  type ScriptOutput,
  type ScriptTone,
} from "@/lib/types";
import { cn } from "@/lib/utils";

/** AI Script Engine — terracotta-accented overlay panel. Mock-first, API-ready. */
export function ScriptEngine({
  open,
  onClose,
  gigId,
  onSendToChat,
}: {
  open: boolean;
  onClose: () => void;
  gigId?: string;
  onSendToChat?: (scriptId: string) => void;
}) {
  const userId = useSession((s) => s.userId)!;
  const addScript = useApp((s) => s.addScript);
  const attachScriptToGig = useApp((s) => s.attachScriptToGig);

  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<ScriptTone>("educational");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [kind, setKind] = useState<ScriptKind>("script");
  const [loading, setLoading] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [output, setOutput] = useState<ScriptOutput | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const inputs = { productName, productDescription, audience, tone, platform, kind };

  const generate = async (regenerateHookOnly = false) => {
    if (!productName.trim()) {
      toast("Add a product name", { tone: "warning" });
      return;
    }
    regenerateHookOnly ? setRegenLoading(true) : setLoading(true);
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inputs, regenerateHookOnly, previous: regenerateHookOnly ? output : undefined }),
      });
      const data = (await res.json()) as { output: ScriptOutput };
      const nextOutput =
        regenerateHookOnly && output?.blocks && data.output.blocks
          ? { ...output, blocks: [data.output.blocks[0], ...output.blocks.slice(1)] }
          : data.output;
      setOutput(nextOutput);
      const doc: ScriptDoc = {
        id: `s${Date.now().toString(36)}`,
        companyId: userId,
        gigId,
        inputs,
        output: nextOutput,
        createdAt: new Date().toISOString(),
      };
      addScript(doc);
      setSavedId(doc.id);
    } catch {
      toast("Generation failed", { body: "Check your connection and try again.", tone: "warning" });
    } finally {
      setLoading(false);
      setRegenLoading(false);
    }
  };

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-text-primary/20 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            variants={slideInRight}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-ai/30 bg-surface shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-ai-soft text-ai">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">AI Script Engine</p>
                  <p className="text-xs text-text-tertiary">Direct-response UGC copy, structured for retention</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 text-text-tertiary hover:bg-surface-2 hover:text-text-primary cursor-pointer" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {/* Inputs */}
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Product name</Label>
                    <Input className="mt-1.5" placeholder="Glow Serum" value={productName} onChange={(e) => setProductName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Target audience</Label>
                    <Input className="mt-1.5" placeholder="Women 22–35, combination skin" value={audience} onChange={(e) => setAudience(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Product description or URL</Label>
                  <Textarea
                    className="mt-1.5 min-h-16"
                    placeholder="What it is, the one claim that matters, and the price."
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Tone</Label>
                    <Select className="mt-1.5" value={tone} onChange={(e) => setTone(e.target.value as ScriptTone)}>
                      {(Object.keys(TONE_LABELS) as ScriptTone[]).map((t) => (
                        <option key={t} value={t}>{TONE_LABELS[t]}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Platform</Label>
                    <Select className="mt-1.5" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
                      {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
                        <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                {/* Output toggle */}
                <div className="flex rounded-[8px] border border-border p-0.5">
                  {([
                    { value: "script", label: "Full Script" },
                    { value: "brief", label: "Bulleted Brief" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setKind(opt.value)}
                      className={cn(
                        "flex-1 rounded-[6px] py-1.5 text-[13px] font-medium transition-colors cursor-pointer",
                        kind === opt.value ? "bg-ai-soft text-ai" : "text-text-tertiary hover:text-text-primary",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <Button variant="ai" className="w-full" onClick={() => generate(false)} disabled={loading}>
                  <Sparkles className="h-4 w-4" />
                  {loading ? "Writing…" : output ? "Regenerate" : kind === "script" ? "Generate script" : "Generate brief"}
                </Button>
              </div>

              {/* Output */}
              {loading && (
                <div className="mt-6 space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              )}

              {output && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-3"
                >
                  <p className="font-serif text-lg font-semibold">{output.title}</p>

                  {output.kind === "script" && output.blocks ? (
                    <div className="space-y-2.5">
                      {output.blocks.map((b, i) => (
                        <div key={i} className={cn("group rounded-[10px] border p-3.5", regenLoading && b.label === "HOOK" ? "border-ai/40 bg-ai-soft/40" : "border-border bg-bg")}>
                          <div className="flex items-center justify-between">
                            <span className="num text-[11px] font-semibold text-ai">
                              [{b.start}–{b.end} {b.label}]
                            </span>
                            <button
                              onClick={() => copy(b.text, i)}
                              className="rounded p-1 text-text-tertiary opacity-0 transition-opacity hover:text-text-primary group-hover:opacity-100 cursor-pointer"
                              aria-label="Copy block"
                            >
                              {copiedIdx === i ? <Check className="h-3.5 w-3.5 text-money" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          {regenLoading && b.label === "HOOK" ? (
                            <Skeleton className="mt-2 h-12 w-full" />
                          ) : (
                            <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">{b.text}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {output.bullets?.map((b, i) => (
                        <li key={i} className="flex gap-2.5 rounded-[8px] border border-border bg-bg p-3 text-[13px] leading-relaxed text-text-secondary">
                          <span className="num shrink-0 font-semibold text-ai">{i + 1}.</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {output.kind === "script" && (
                      <Button variant="aiOutline" size="sm" onClick={() => generate(true)} disabled={regenLoading}>
                        <RefreshCw className={cn("h-3.5 w-3.5", regenLoading && "animate-spin")} /> Regenerate hook only
                      </Button>
                    )}
                    {onSendToChat && savedId && (
                      <Button
                        size="sm"
                        onClick={() => {
                          onSendToChat(savedId);
                          toast("Script sent", { body: "It's in the chat as a script card.", tone: "success" });
                          onClose();
                        }}
                      >
                        <Send className="h-3.5 w-3.5" /> Send to creator
                      </Button>
                    )}
                    {gigId && savedId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          attachScriptToGig(savedId, gigId);
                          toast("Attached to gig brief", { tone: "success" });
                        }}
                      >
                        <Paperclip className="h-3.5 w-3.5" /> Attach to gig brief
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
