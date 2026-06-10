"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, UserRound } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Logo } from "@/components/shared/logo";
import { useSession } from "@/lib/store/session";
import type { Role } from "@/lib/types";

const loginSchema = z.object({
  role: z.enum(["creator", "company"]),
  email: z.string().email(),
});

export default function LoginPage() {
  const router = useRouter();
  const signInDemo = useSession((s) => s.signInDemo);

  const signIn = (role: Role) => {
    const parsed = loginSchema.safeParse({
      role,
      email: role === "creator" ? "creator@mcc.demo" : "brand@mcc.demo",
    });
    if (!parsed.success) return;
    signInDemo(parsed.data.role);
    router.push("/dashboard");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6">
      <Logo />
      <div className="grid flex-1 items-center gap-8 py-10 md:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="text-[12px] font-medium uppercase text-text-tertiary">Demo sign in</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight md:text-5xl">
            Open a live marketplace workspace in one click.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-secondary">
            The app runs with seeded Supabase-ready data, mock payments, and a typed AI
            script generator until production keys are connected.
          </p>
        </section>

        <Card>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value="demo@mcc.local" readOnly className="mt-1.5" />
            </div>
            <div className="grid gap-3">
              <Button onClick={() => signIn("creator")} variant="money" size="lg" className="justify-between">
                <span className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" /> Continue as creator
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={() => signIn("company")} size="lg" className="justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Continue as brand
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-text-tertiary">
              Google OAuth and email magic links are represented by this demo entry point.
              The Supabase schema and RLS policies are included under `supabase/migrations`.
            </p>
            <p className="text-sm text-text-secondary">
              New here?{" "}
              <Link href="/signup" className="font-medium text-text-primary underline underline-offset-4">
                Start onboarding
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
