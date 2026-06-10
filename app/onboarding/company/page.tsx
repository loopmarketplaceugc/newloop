"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, Search, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/store/session";
import { NICHES, type Niche } from "@/lib/types";

const companyOnboardingSchema = z.object({
  companyName: z.string().min(2),
  website: z.string().url(),
  budget: z.coerce.number().int().min(250).max(50000),
  niche: z.enum(NICHES),
});

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useSession((s) => s.completeOnboarding);
  const [companyName, setCompanyName] = useState("Lumen Pantry");
  const [website, setWebsite] = useState("https://lumenpantry.example");
  const [budget, setBudget] = useState("6500");
  const [niche, setNiche] = useState<Niche>("food");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const parsed = companyOnboardingSchema.safeParse({ companyName, website, budget, niche });
    if (!parsed.success) {
      setError("Use a company name, valid URL, and campaign budget above $250.");
      return;
    }
    completeOnboarding();
    router.push("/dashboard/discover");
  };

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-5 py-8 md:grid-cols-[0.85fr_1.15fr]">
      <section className="self-center">
        <p className="text-[12px] font-medium uppercase text-text-tertiary">Brand onboarding</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight">Start with buying intent, not browsing.</h1>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          MCC captures the campaign budget and vertical first, then moves brands into
          creator discovery, scripts, contracts, and escrow.
        </p>
        <div className="mt-8 grid gap-3">
          {[
            { icon: Search, text: "Filter creators by tier, niche, rate, and availability." },
            { icon: ShieldCheck, text: "Fund escrow only after the creator accepts terms." },
            { icon: Building2, text: "Keep every brand conversation tied to a gig." },
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
              <Label>Company name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Campaign budget</Label>
              <Input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="numeric" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>What are you selling?</Label>
            <Textarea readOnly value="Founder-led UGC for a launch campaign. Need product demo, testimonial, and raw footage options." className="mt-1.5 min-h-24" />
          </div>
          <div>
            <Label>Primary niche</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {NICHES.map((n) => (
                <button key={n} onClick={() => setNiche(n)} className="cursor-pointer">
                  <Badge variant={niche === n ? "ai" : "outline"}>
                    {niche === n ? <Check className="h-3 w-3" /> : null}
                    {n}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
          {error ? <p className="text-xs text-danger">{error}</p> : null}
          <Button onClick={submit} size="lg" className="w-full">
            Find matching creators
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
