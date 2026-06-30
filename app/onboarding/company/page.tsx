"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Rocket } from "lucide-react";
import { z } from "zod";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useSession } from "@/lib/store/session";
import { saveCompanyProfile } from "@/lib/auth";
import { authHeaders } from "@/lib/sync";
import { DEV_PAYMENTS } from "@/lib/payments";
import { TypeOnce } from "@/components/shared/typewriter";
import { NICHES } from "@/lib/types";
import { cn } from "@/lib/utils";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const fieldSchemas = {
  companyName: z.string().min(2, "what's the brand called?"),
  website: z.string().regex(/^(https?:\/\/)?[\w-]+(\.[\w-]+)+\S*$/, "that doesn't look like a URL"),
  budget: z.string().min(1, "pick a range — you can change it anytime"),
};

type TextStepId = "companyName" | "website";

interface TextStep {
  kind: "text";
  id: TextStepId;
  q: string;
  sub?: string;
  placeholder: string;
}

type Step =
  | TextStep
  | { kind: "niche"; q: string }
  | { kind: "budget"; q: string }
  | { kind: "balance"; q: string; sub: string }
  | { kind: "tos"; q: string; sub: string }
  | { kind: "done"; q: string };

const BUDGETS = ["under $1k / mo", "$1k–5k / mo", "$5k–20k / mo", "$20k+ / mo"];
const BALANCE_OPTIONS = ["$0", "$50", "$100", "$250+"];
type PaidBalance = "$50" | "$100" | "$250+";

// ── Dev-mode mock — simulates a successful payment without Stripe ─────────────
function DevBalanceSection({ balanceLabel, onPaid }: { balanceLabel: string; onPaid: () => void }) {
  const [simulating, setSimulating] = useState(false);
  const simulate = async () => {
    setSimulating(true);
    await new Promise<void>((r) => setTimeout(r, 800));
    onPaid();
  };
  return (
    <div className="mt-5 rounded-[20px] border-2 border-dashed border-[#faf6ef]/20 bg-[#faf6ef]/[0.03] p-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#faf6ef]/30">
        Dev mode — no real charge
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => void simulate()}
        disabled={simulating}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#f2a3df] py-4 font-serif text-lg font-bold text-ink disabled:opacity-50"
      >
        {simulating && <Loader2 className="h-5 w-5 animate-spin" />}
        {simulating ? "Simulating…" : `Simulate ${balanceLabel} payment →`}
      </motion.button>
    </div>
  );
}

// ── Stripe inner form — must live inside <Elements> ──────────────────────────
function StripeBalanceInner({ balanceLabel, onPaid }: { balanceLabel: string; onPaid: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setErr(null);
    const { error } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (error) {
      setErr(error.message ?? "Payment failed. Try again.");
      setPaying(false);
    } else {
      onPaid();
    }
  };

  return (
    <div className="mt-5 rounded-[20px] border-2 border-[#faf6ef]/15 bg-[#faf6ef]/5 p-5">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#faf6ef]/40">
        Card details
      </p>
      <PaymentElement options={{ layout: "tabs" }} />
      {err && (
        <motion.p
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-3 text-sm font-bold text-[#f2a3df]"
        >
          ↳ {err}
        </motion.p>
      )}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => void handlePay()}
        disabled={!stripe || paying}
        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#f2a3df] py-4 font-serif text-lg font-bold text-ink disabled:opacity-50"
      >
        {paying && <Loader2 className="h-5 w-5 animate-spin" />}
        {paying ? "Processing…" : `Pay ${balanceLabel} & continue →`}
      </motion.button>
    </div>
  );
}

// ── Fetches a PaymentIntent then renders Elements ─────────────────────────────
function StripeBalanceSection({
  balance,
  brandId,
  email,
  onPaid,
}: {
  balance: PaidBalance;
  brandId: string;
  email?: string;
  onPaid: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setClientSecret(null);
    setLoading(true);
    setErr(null);
    let cancelled = false;
    void (async () => {
      try {
        // brandId is derived server-side from the auth token; the header carries it.
        const res = await fetch("/api/stripe/payment-intent", {
          method: "POST",
          headers: await authHeaders(),
          body: JSON.stringify({ balance, email }),
        });
        const d = (await res.json()) as { clientSecret?: string; error?: string };
        if (cancelled) return;
        if (d.clientSecret) setClientSecret(d.clientSecret);
        else setErr(d.error ?? "Couldn't initialize payment.");
      } catch {
        if (!cancelled) setErr("Network error — check your connection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [balance, brandId, email]);

  if (loading) {
    return (
      <div className="mt-5 flex items-center gap-2 text-[#faf6ef]/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-bold">Setting up payment…</span>
      </div>
    );
  }

  if (err || !clientSecret) {
    return (
      <p className="mt-4 text-sm font-bold text-[#f2a3df]">
        ↳ {err ?? "Payment unavailable — check Stripe configuration."}
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#f2a3df",
            colorBackground: "#1a1a0e",
            colorText: "#faf6ef",
            colorDanger: "#f2a3df",
            borderRadius: "14px",
          },
        },
      }}
    >
      <StripeBalanceInner balanceLabel={balance} onPaid={onPaid} />
    </Elements>
  );
}

export default function CompanyOnboarding() {
  const router = useRouter();
  const session = useSession();
  const completeOnboarding = useSession((s) => s.completeOnboarding);
  const setName = useSession((s) => s.setName);
  const userId = useSession((s) => s.userId);
  const email = useSession((s) => s.email);

  const [stepIdx, setStepIdx] = useState(0);
  const [typed, setTyped] = useState(false);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({ companyName: "", website: "" });
  const [niches, setNiches] = useState<string[]>([]);
  const [budget, setBudget] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [tosAgreed, setTosAgreed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBalancePaid = () => {
    setDir(1);
    setStepIdx((i) => i + 1);
  };

  const steps: Step[] = useMemo(
    () => [
      { kind: "text", id: "companyName", q: "What's the brand called?", placeholder: "Lumen Skincare" },
      {
        kind: "text",
        id: "website",
        q: `Where can creators find ${values.companyName || "you"}?`,
        placeholder: "lumenskin.co",
      },
      { kind: "niche", q: "What spaces are you in?" },
      { kind: "budget", q: "Monthly UGC budget?" },
      {
        kind: "balance",
        q: "Want to pre-load a balance?",
        sub: "Brands with $250+ loaded get shown 2x more often to creators.",
      },
      {
        kind: "tos",
        q: "Almost there.",
        sub: "Agree to Loop's terms to activate your brand account.",
      },
      { kind: "done", q: "You're live on Loop." },
    ],
    [values.companyName],
  );

  const step = steps[Math.min(stepIdx, steps.length - 1)];
  const progress = Math.round((stepIdx / (steps.length - 1)) * 100);

  useEffect(() => {
    setTyped(false);
    setError(null);
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [stepIdx]);

  const next = () => {
    setError(null);
    if (step.kind === "text") {
      const r = fieldSchemas[step.id].safeParse(values[step.id].trim());
      if (!r.success) {
        setError(r.error.issues[0].message);
        return;
      }
    }
    if (step.kind === "niche" && niches.length === 0) {
      setError("pick at least one");
      return;
    }
    if (step.kind === "budget" && !budget) {
      setError("pick a range — you can change it anytime");
      return;
    }
    if (step.kind === "balance" && !balance) {
      setError("pick an option to continue");
      return;
    }
    if (step.kind === "tos" && !tosAgreed) {
      setError("you need to agree to the terms before continuing");
      return;
    }
    if (step.kind === "done") {
      setName(values.companyName);
      void saveCompanyProfile({
        companyName: values.companyName,
        website: values.website,
        niches,
        budgetRange: budget ?? "",
        balance: balance ?? "$0",
      });
      completeOnboarding();
      router.push("/dashboard/discover");
      return;
    }
    setDir(1);
    setStepIdx((i) => i + 1);
  };

  const back = () => {
    if (stepIdx === 0) return;
    setDir(-1);
    setStepIdx((i) => i - 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink text-[#faf6ef]">
      <div className="fixed inset-x-0 top-0 z-50 h-1.5 bg-[#faf6ef]/10">
        <motion.div className="h-full bg-[#f2a3df]" animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
      </div>

      <header className="flex items-center justify-between px-6 py-5">
        <span className="font-serif text-xl font-extrabold text-[#a8d98a]">loop</span>
        <span className="num text-xs font-bold uppercase tracking-widest text-[#faf6ef]/40">
          {Math.min(stepIdx + 1, steps.length)} / {steps.length}
        </span>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={stepIdx}
            custom={dir}
            initial={{ opacity: 0, y: dir * 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dir * -60 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl"
          >
            <h1 className="font-serif min-h-[2.2em] text-3xl font-extrabold leading-tight sm:text-5xl">
              <TypeOnce text={step.q} speed={22} onDone={() => setTyped(true)} />
            </h1>
            {"sub" in step && step.sub && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: typed ? 1 : 0 }} className="mt-3 text-base font-medium text-[#faf6ef]/50">
                {step.sub}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: typed ? 1 : 0, y: typed ? 0 : 16 }}
              transition={{ duration: 0.25 }}
              className="mt-10"
            >
              {step.kind === "text" && (
                <input
                  ref={inputRef}
                  value={values[step.id]}
                  placeholder={step.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, [step.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  className="w-full border-b-4 border-[#faf6ef]/20 bg-transparent pb-3 font-serif text-3xl font-bold text-[#f2a3df] placeholder:text-[#faf6ef]/15 focus:border-[#a8d98a] focus:outline-none sm:text-5xl"
                  style={{ boxShadow: "none", borderRadius: 0 }}
                />
              )}

              {step.kind === "niche" && (
                <div className="flex flex-wrap gap-3">
                  {NICHES.map((n, i) => {
                    const on = niches.includes(n);
                    return (
                      <motion.button
                        key={n}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.03 * i }}
                        whileHover={{ scale: 1.08, rotate: i % 2 ? 2 : -2 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() =>
                          setNiches((prev) =>
                            prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n],
                          )
                        }
                        className={cn(
                          "rounded-full border-[3px] px-5 py-2.5 font-serif text-lg font-bold transition-colors cursor-pointer",
                          on ? "border-transparent bg-[#a8d98a] text-ink" : "border-[#faf6ef]/20 text-[#faf6ef] hover:border-[#faf6ef]/50",
                        )}
                      >
                        {on && <Check className="mr-1 inline h-4 w-4" />}
                        {n}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {step.kind === "budget" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {BUDGETS.map((b, i) => {
                    const on = budget === b;
                    return (
                      <motion.button
                        key={b}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i }}
                        whileHover={{ scale: 1.04, rotate: i % 2 ? 1 : -1 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setBudget(b)}
                        className={cn(
                          "rounded-[20px] border-[3px] px-6 py-5 text-left font-serif text-xl font-bold transition-colors cursor-pointer",
                          on ? "border-transparent bg-[#f2a3df] text-ink" : "border-[#faf6ef]/20 text-[#faf6ef] hover:border-[#faf6ef]/50",
                        )}
                      >
                        {on && <Check className="mr-2 inline h-5 w-5" />}
                        <span className="num">{b}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {step.kind === "balance" && (
                <div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {BALANCE_OPTIONS.map((b, i) => {
                      const on = balance === b;
                      return (
                        <motion.button
                          key={b}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * i }}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setBalance(b)}
                          className={cn(
                            "rounded-[20px] border-[3px] px-6 py-5 text-center font-serif text-xl font-bold transition-colors cursor-pointer",
                            on ? "border-transparent bg-[#f2a3df] text-ink" : "border-[#faf6ef]/20 text-[#faf6ef] hover:border-[#faf6ef]/50",
                          )}
                        >
                          {on && <Check className="mr-1 inline h-4 w-4" />}
                          <span className="num">{b === "$0" ? "Skip" : b}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Payment form — only for paid amounts */}
                  <AnimatePresence>
                    {balance && balance !== "$0" && userId && (
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.25 }}
                      >
                        {DEV_PAYMENTS ? (
                          <DevBalanceSection
                            balanceLabel={balance}
                            onPaid={handleBalancePaid}
                          />
                        ) : (
                          <StripeBalanceSection
                            balance={balance as PaidBalance}
                            brandId={userId}
                            email={email ?? undefined}
                            onPaid={handleBalancePaid}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* TERMS OF SERVICE */}
              {step.kind === "tos" && (
                <div className="space-y-5">
                  <div className="rounded-[20px] border-[3px] border-[#faf6ef]/15 bg-[#faf6ef]/[0.04] p-6 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#faf6ef]/40">Key terms</p>
                    <ul className="space-y-3 text-sm font-medium text-[#faf6ef]/70">
                      <li className="flex gap-3">
                        <span className="text-[#a8d98a] shrink-0 font-bold">→</span>
                        All connections made through Loop must transact on Loop — taking deals off-platform is a breach of these Terms.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-[#a8d98a] shrink-0 font-bold">→</span>
                        Every deal signed through Loop is legally binding — both parties must follow the contract terms in full.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-[#a8d98a] shrink-0 font-bold">→</span>
                        Brands must fund escrow in full before a gig enters production.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-[#a8d98a] shrink-0 font-bold">→</span>
                        You may not contact or engage creators outside Loop for any deal that originated on the platform, for 12 months after the gig.
                      </li>
                    </ul>
                    <a href="/legal#terms" target="_blank" className="text-xs font-bold text-[#f2a3df] underline underline-offset-2 hover:text-[#f2a3df]/70 transition-colors">
                      Read full Terms of Service →
                    </a>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tosAgreed}
                      onChange={(e) => setTosAgreed(e.target.checked)}
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-[#a8d98a]"
                    />
                    <span className="text-sm font-medium text-[#faf6ef]/70">
                      I agree to Loop&apos;s{" "}
                      <a href="/legal#terms" target="_blank" className="text-[#a8d98a] underline underline-offset-2">
                        Terms of Service
                      </a>{" "}
                      and confirm I&apos;m at least 18 years old and authorised to bind my company to these terms.
                    </span>
                  </label>
                </div>
              )}

              {step.kind === "done" && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-wrap items-center gap-3">
                  {niches.map((n) => (
                    <span key={n} className="sticker bg-[#f2a3df] text-ink">{n}</span>
                  ))}
                  <span className="sticker bg-[#a8d98a] text-ink">{budget}</span>
                  <span className="rounded-full bg-[#faf6ef]/10 px-4 py-2 text-sm font-bold">{values.website}</span>
                  {balance && balance !== "$0" && (
                    <span className="rounded-full bg-[#faf6ef]/10 px-4 py-2 text-sm font-bold">{balance} balance</span>
                  )}
                </motion.div>
              )}

              {error && (
                <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="mt-4 text-sm font-bold text-[#f2a3df]">
                  ↳ {error}
                </motion.p>
              )}

              <div className="mt-10 flex items-center gap-3">
                {/* Hide OK + hint when Stripe form is active — it has its own Pay button */}
                {!(step.kind === "balance" && balance && balance !== "$0") && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={next}
                      className={cn(
                        "flex items-center gap-2 rounded-full px-8 py-4 font-serif text-lg font-bold cursor-pointer",
                        step.kind === "done" ? "bg-[#f2a3df] text-ink" : "bg-[#a8d98a] text-ink",
                      )}
                    >
                      {step.kind === "done" ? (
                        <>
                          <Rocket className="h-5 w-5" /> Find creators
                        </>
                      ) : (
                        <>
                          OK <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </motion.button>
                    {step.kind !== "done" && (
                      <span className="hidden text-xs font-bold uppercase tracking-widest text-[#faf6ef]/30 sm:block">
                        press Enter ↵
                      </span>
                    )}
                  </>
                )}
                {stepIdx > 0 && step.kind !== "done" && (
                  <button
                    onClick={back}
                    className="ml-auto flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold text-[#faf6ef]/40 transition-colors hover:text-[#faf6ef] cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" /> back
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-10 top-1/4 h-32 w-32 animate-float rounded-[40%_60%_55%_45%/55%_45%_60%_40%] bg-[#a8d98a]/15" />
        <div className="absolute -right-8 bottom-1/4 h-40 w-40 animate-float rounded-[60%_40%_45%_55%/45%_55%_40%_60%] bg-[#f2a3df]/15 [animation-delay:1s]" />
      </div>
    </div>
  );
}
