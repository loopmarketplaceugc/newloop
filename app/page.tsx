import Link from "next/link";
import {
  ArrowRight,
  FileSignature,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Video,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/logo";

const steps = [
  {
    icon: MessagesSquare,
    title: "Match & negotiate",
    body: "Brands filter creators by niche, tier, rate, and capacity. Offers, scripts, and terms all live in one thread.",
  },
  {
    icon: Sparkles,
    title: "Script with AI",
    body: "Generate platform-native scripts with timed hooks, or a bulleted brief — then send it straight into the chat.",
    ai: true,
  },
  {
    icon: ShieldCheck,
    title: "Fund escrow",
    body: "The brand funds the gig up front. Money sits in escrow with a contract auto-generated from the accepted offer.",
  },
  {
    icon: Video,
    title: "Create & deliver",
    body: "Creators upload to the gig workspace. Watermarked previews until approval, originals unlock at payout.",
  },
  {
    icon: Wallet,
    title: "Approve & get paid",
    body: "On approval, payment releases instantly — minus a flat 10%. Silence for 14 days? It auto-approves. No ghosting.",
  },
  {
    icon: FileSignature,
    title: "Usage rights, tracked",
    body: "Every contract carries a usage-rights expiry date, surfaced on both dashboards with reminders before it lapses.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 pb-20 pt-16 text-center sm:pt-24">
        <Badge variant="ai" className="mx-auto mb-6">
          <Sparkles className="h-3 w-3" /> AI scripting built in
        </Badge>
        <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          UGC deals, from first message to final payout.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
          MCC connects creators with brands — then runs the whole workflow: AI scripts,
          auto-contracts, escrowed payment, delivery tracking, and usage-rights reminders.
          No spreadsheets, no ghosting, no chasing invoices.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/signup?role=creator">
              I&apos;m a Creator <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/signup?role=company">
              I&apos;m a Brand <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mx-auto mt-12 flex max-w-md items-center justify-center gap-6 text-[13px] text-text-tertiary">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-money" /> Escrow-protected
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber fill-amber" /> Dual reviews
          </span>
          <span className="num">10% flat fee</span>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            How it works
          </h2>
          <p className="mt-2 max-w-xl text-[15px] text-text-secondary">
            One workspace per gig. Every step below happens inside it — and the status
            machine keeps both sides honest.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.title}
                className="rounded-[12px] border border-border bg-bg p-5 transition-colors hover:border-border-bright"
              >
                <div
                  className={
                    s.ai
                      ? "mb-4 flex h-9 w-9 items-center justify-center rounded-[8px] bg-ai-soft text-ai"
                      : "mb-4 flex h-9 w-9 items-center justify-center rounded-[8px] bg-surface-2 text-text-secondary"
                  }
                >
                  <s.icon className="h-[18px] w-[18px]" />
                </div>
                <h3 className="text-[15px] font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual CTA */}
      <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-20 md:grid-cols-2">
        <div className="rounded-[12px] border border-border bg-surface p-8">
          <h3 className="font-serif text-xl font-semibold">For creators</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Set your rates, usage upcharges, and weekly capacity once. Get matched with
            brands that pay into escrow before you press record — and get reminded when
            your usage rights expire.
          </p>
          <Button asChild variant="money" className="mt-6">
            <Link href="/signup?role=creator">Build your profile</Link>
          </Button>
        </div>
        <div className="rounded-[12px] border border-border bg-surface p-8">
          <h3 className="font-serif text-xl font-semibold">For brands</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Filter vetted UGC creators by niche, tier, and rate. Generate scripts with AI,
            send offers in chat, and approve deliverables — payment releases itself.
          </p>
          <Button asChild className="mt-6">
            <Link href="/signup?role=company">Find creators</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-[13px] text-text-tertiary sm:flex-row">
          <span>© 2026 MCC — The Marketplace for Content Creation</span>
          <span className="num">creators keep 90% of every gig</span>
        </div>
      </footer>
    </div>
  );
}
