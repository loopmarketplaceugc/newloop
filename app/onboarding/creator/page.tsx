"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, DollarSign, Upload } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/store/session";
import { useApp } from "@/lib/store/app";
import { DEMO_CREATOR_ID } from "@/lib/seed";
import { NICHES, type Niche } from "@/lib/types";
import { cn } from "@/lib/utils";

const creatorOnboardingSchema = z.object({
  rate: z.coerce.number().int().min(50).max(10000),
  capacity: z.coerce.number().int().min(1).max(12),
  bio: z.string().min(30),
  niches: z.array(z.enum(NICHES)).min(2),
});

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useSession((s) => s.completeOnboarding);
  const updateCreator = useApp((s) => s.updateCreator);
  const [rate, setRate] = useState("450");
  const [capacity, setCapacity] = useState("4");
  const [bio, setBio] = useState("I make founder-led UGC with clean hooks, product demos, and sharp retention edits for beauty and SaaS brands.");
  const [niches, setNiches] = useState<Niche[]>(["beauty", "SaaS"]);
  const [error, setError] = useState<string | null>(null);

  const toggle = (niche: Niche) =>
    setNiches((current) =>
      current.includes(niche) ? current.filter((n) => n !== niche) : [...current, niche],
    );

  const submit = () => {
    const parsed = creatorOnboardingSchema.safeParse({ rate, capacity, bio, niches });
    if (!parsed.success) {
      setError("Add a stronger bio, pick at least two niches, and keep rate/capacity in range.");
      return;
    }
    updateCreator(DEMO_CREATOR_ID, {
      baseRateCents: parsed.data.rate * 100,
      capacityPerWeek: parsed.data.capacity,
      bio: parsed.data.bio,
      niches: parsed.data.niches,
      status: "open",
    });
    completeOnboarding();
    router.push("/dashboard");
  };

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-5 py-8 md:grid-cols-[0.85fr_1.15fr]">
      <section className="self-center">
        <p className="text-[12px] font-medium uppercase text-text-tertiary">Creator onboarding</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight">Set the profile brands can buy.</h1>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          MCC matches on structured fields first: niches, rates, capacity, usage rights,
          and product-exchange preferences.
        </p>
        <div className="mt-8 grid gap-3">
          {[
            { icon: DollarSign, text: "Base rate stored in cents for clean payouts." },
            { icon: Camera, text: "Portfolio media routes to Supabase Storage." },
            { icon: Upload, text: "Deliverables stay watermarked until payout." },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 rounded-[12px] border border-border bg-surface p-3 text-sm">
              <item.icon className="h-4 w-4 text-text-tertiary" />
              {item.text}
            </div>
          ))}
        </div>
      </section>
      <Card className="self-center">
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Base video rate</Label>
              <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="numeric" className="mt-1.5" />
            </div>
            <div>
              <Label>Weekly capacity</Label>
              <Input value={capacity} onChange={(e) => setCapacity(e.target.value)} inputMode="numeric" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Creator bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1.5 min-h-28" />
          </div>
          <div>
            <Label>Niches</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {NICHES.map((niche) => {
                const active = niches.includes(niche);
                return (
                  <button key={niche} onClick={() => toggle(niche)} className="cursor-pointer">
                    <Badge variant={active ? "money" : "outline"} className={cn(active && "border-money")}>
                      {active ? <Check className="h-3 w-3" /> : null}
                      {niche}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
          {error ? <p className="text-xs text-danger">{error}</p> : null}
          <Button onClick={submit} variant="money" size="lg" className="w-full">
            Finish creator profile
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
