"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, UserRound } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/store/session";
import type { Role } from "@/lib/types";

const signupSchema = z.object({
  role: z.enum(["creator", "company"]),
  email: z.string().email(),
});

export default function SignupPage() {
  const router = useRouter();
  const signInDemo = useSession((s) => s.signInDemo);
  const [role, setRole] = useState<Role>("creator");
  const [email, setEmail] = useState("founder@mcc.demo");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("role");
    if (requested === "creator" || requested === "company") setRole(requested);
  }, []);

  const submit = () => {
    const parsed = signupSchema.safeParse({ role, email });
    if (!parsed.success) {
      setError("Use a valid email before starting onboarding.");
      return;
    }
    signInDemo(parsed.data.role, { onboarded: false });
    router.push(`/onboarding/${parsed.data.role}`);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6">
      <Logo />
      <div className="grid flex-1 items-center gap-8 py-10 md:grid-cols-[0.95fr_1.05fr]">
        <section>
          <p className="text-[12px] font-medium uppercase text-text-tertiary">Create workspace</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight md:text-5xl">
            Build the side of MCC you want to demo.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-secondary">
            Creator onboarding captures rates, capacity, niches, and portfolio. Brand
            onboarding captures campaign budget, niche, and matching preferences.
          </p>
        </section>
        <Card>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: "creator" as const, label: "Creator", icon: UserRound, body: "Set rates and portfolio." },
                { value: "company" as const, label: "Brand", icon: Building2, body: "Find creators and fund gigs." },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRole(option.value)}
                  className={cn(
                    "rounded-[12px] border p-4 text-left transition-colors",
                    role === option.value
                      ? "border-text-primary bg-surface-2"
                      : "border-border bg-surface hover:border-border-bright",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <option.icon className="h-5 w-5 text-text-secondary" />
                    {role === option.value ? <Check className="h-4 w-4 text-money" /> : null}
                  </div>
                  <p className="mt-3 text-sm font-semibold">{option.label}</p>
                  <p className="mt-1 text-xs text-text-secondary">{option.body}</p>
                </button>
              ))}
            </div>
            <div>
              <Label htmlFor="email">Work email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
              {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
            </div>
            <Button onClick={submit} size="lg" className="w-full">
              Start {role === "creator" ? "creator" : "brand"} onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
