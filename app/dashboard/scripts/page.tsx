"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Sparkles } from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ScriptEngine } from "@/components/company/script-engine";
import { PLATFORM_LABELS, TONE_LABELS } from "@/lib/types";
import { daysAgo } from "@/lib/format";

function ScriptsInner() {
  const params = useSearchParams();
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const { scripts, gigs } = useApp();
  const [engineOpen, setEngineOpen] = useState(false);

  useEffect(() => {
    if (params.get("new") === "1") setEngineOpen(true);
  }, [params]);

  if (!hydrated || !userId) return <CardSkeleton />;

  const mine = scripts.filter((s) => s.companyId === userId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Script library</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Every script and brief you&apos;ve generated, ready to send into any chat.
          </p>
        </div>
        <Button variant="ai" size="sm" onClick={() => setEngineOpen(true)}>
          <Sparkles className="h-4 w-4" /> New script
        </Button>
      </div>

      {mine.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No scripts yet"
          body="Generate your first UGC script — pick a tone, a platform, and let the engine structure the hook, body, and CTA."
          action={
            <Button variant="ai" size="sm" onClick={() => setEngineOpen(true)}>
              <Sparkles className="h-4 w-4" /> Generate a script
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((s) => {
            const gig = gigs.find((g) => g.id === s.gigId);
            return (
              <Card key={s.id} className="flex h-full flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-ai-soft text-ai">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span className="num text-[11px] text-text-tertiary">{daysAgo(s.createdAt)}</span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-snug">{s.output.title}</p>
                <p className="mt-1.5 line-clamp-3 flex-1 text-[13px] leading-relaxed text-text-secondary">
                  {s.output.kind === "script"
                    ? s.output.blocks?.[0]?.text
                    : s.output.bullets?.[0]}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="ai">{s.output.kind === "script" ? "Full script" : "Brief"}</Badge>
                  <Badge>{TONE_LABELS[s.inputs.tone]}</Badge>
                  <Badge variant="outline">{PLATFORM_LABELS[s.inputs.platform]}</Badge>
                </div>
                {gig && (
                  <p className="mt-2.5 border-t border-border pt-2.5 text-xs text-text-tertiary">
                    Attached to <span className="font-medium text-text-secondary">{gig.title}</span>
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ScriptEngine open={engineOpen} onClose={() => setEngineOpen(false)} />
    </div>
  );
}

export default function ScriptsPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <ScriptsInner />
    </Suspense>
  );
}
