"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  FileSignature,
  FileVideo,
  Lock,
  Package,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/ui/status-pill";
import { Avatar } from "@/components/ui/avatar";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CardSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { StarPicker } from "@/components/shared/star-rating";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { ScriptEngine } from "@/components/company/script-engine";
import { companyById } from "@/lib/seed";
import { fetchMyWorld, fetchProfileNames, subscribeToGig } from "@/lib/sync";
import { haptics } from "@/lib/haptics";
import { confirmGigPayment, payForGig } from "@/lib/payments";
import {
  AUTO_APPROVE_DAYS,
  MAX_REVISIONS,
  STATUS_LABELS,
  creatorPayoutCents,
  mainPath,
  refundPolicy,
} from "@/lib/gig-machine";
import { daysUntil, formatDate, formatMoney, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GigStatus } from "@/lib/types";

const REVIEW_TAGS = ["on-time", "great communication", "exceeded brief", "fast approval", "clear brief", "would rehire"];

export default function GigWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const role = useSession((s) => s.role);
  const isDemo = useSession((s) => s.isDemo);
  const app = useApp();
  const [draft, setDraft] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [engineOpen, setEngineOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [trackingDraft, setTrackingDraft] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [offerPrice, setOfferPrice] = useState(450);
  const [offerDeliverables, setOfferDeliverables] = useState("1 × 30s vertical video, 2 revision rounds");
  const [offerUsage, setOfferUsage] = useState(90);
  const [offerRaw, setOfferRaw] = useState(false);
  const [profileNames, setProfileNames] = useState<Record<string, { name: string; hue: number }>>({});
  const [liveChecked, setLiveChecked] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const gig = app.gigs.find((g) => g.id === id);
  const msgs = app.messages.filter((m) => m.gigId === id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [msgs.length, hydrated]);

  // Returning from Stripe Checkout: verify with Stripe, then mark the gig paid.
  useEffect(() => {
    if (!hydrated || !gig) return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("paid") === "1") {
      const sessionId = sp.get("session_id");
      window.history.replaceState({}, "", `/gig/${gig.id}`);
      void (async () => {
        try {
          if (!sessionId) throw new Error("Missing Stripe confirmation.");
          const { paymentIntentId } = await confirmGigPayment({ gigId: gig.id, sessionId });
          if (gig.status === "OFFER_ACCEPTED") useApp.getState().fundEscrow(gig.id, paymentIntentId);
          haptics.success();
          toast("Payment complete", {
            body: "The creator is paid and cleared to start.",
            tone: "success",
          });
        } catch (e) {
          haptics.error();
          toast("Payment needs review", {
            body: e instanceof Error ? e.message : "Stripe did not confirm the payment.",
            tone: "warning",
          });
        }
      })();
    } else if (sp.get("paid") === "0") {
      window.history.replaceState({}, "", `/gig/${gig.id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, gig?.id, gig?.status]);

  useEffect(() => {
    if (!hydrated || !userId || isDemo) return;
    let cancelled = false;
    setLiveChecked(false);

    const refresh = async () => {
      const world = await fetchMyWorld();
      if (!cancelled && world) useApp.getState().setLiveWorld(world);
      if (!cancelled) setLiveChecked(true);
    };

    const unsubscribe = subscribeToGig(
      id,
      (message) => {
        const known = useApp.getState().messages.some((m) => m.id === message.id);
        // Buzz on a genuinely new message from the other party — immersive chat.
        if (!known && message.senderId !== userId) haptics.message();
        useApp.getState().upsertMessage(message);
      },
      (updatedGig) => useApp.getState().upsertGig(updatedGig),
    );
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [hydrated, id, isDemo, userId]);

  useEffect(() => {
    if (isDemo || !gig) return;
    let cancelled = false;
    void fetchProfileNames([gig.companyId, gig.creatorId]).then((names) => {
      if (!cancelled) setProfileNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [gig?.companyId, gig?.creatorId, isDemo]);

  if (!hydrated || !userId || (!isDemo && !gig && !liveChecked)) {
    return <div className="p-6"><CardSkeleton /></div>;
  }
  if (!gig) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="font-serif text-2xl font-semibold">Gig not found</p>
        <Button asChild variant="outline"><Link href="/dashboard">Back to dashboard</Link></Button>
      </div>
    );
  }

  const creator = app.creators.find((c) => c.id === gig.creatorId);
  const company = companyById(gig.companyId);
  const companyProfile = profileNames[gig.companyId];
  const companyName = company?.name ?? companyProfile?.name ?? "Brand";
  const companyHue = company?.logoHue ?? companyProfile?.hue ?? 285;
  const contract = app.contracts.find((c) => c.gigId === gig.id);
  const deliverables = app.deliverables.filter((d) => d.gigId === gig.id);
  const script = app.scripts.find((s) => s.id === gig.scriptId);
  const isCreator = role === "creator";
  const myReview = app.reviews.find((r) => r.gigId === gig.id && r.authorId === userId);
  const path = mainPath(gig.physicalProduct);
  const pathIdx = path.indexOf(gig.status as (typeof path)[number]);
  const refund = refundPolicy(gig.status);

  const send = () => {
    if (!draft.trim()) return;
    haptics.select();
    app.sendMessage({ gigId: gig.id, senderId: userId, kind: "text", text: draft.trim() });
    setDraft("");
  };

  const sendOffer = () => {
    app.sendMessage({
      gigId: gig.id,
      senderId: userId,
      kind: "offer",
      offer: {
        priceCents: offerPrice * 100,
        deliverables: offerDeliverables,
        usageRightsDays: offerUsage,
        rawFootageIncluded: offerRaw,
        state: "pending",
      },
    });
    if (gig.status === "DRAFT") app.transition(gig.id, "OFFER_SENT");
    setOfferOpen(false);
    toast("Offer sent", { body: "The creator can accept or decline right in the chat.", tone: "success" });
  };

  const submitReview = () => {
    app.addReview({
      gigId: gig.id,
      authorId: userId,
      targetId: isCreator ? gig.companyId : gig.creatorId,
      rating,
      tags: reviewTags,
      body: reviewBody,
    });
    setReviewOpen(false);
    toast("Review posted", { body: "Thanks — dual reviews keep the marketplace honest.", tone: "success" });
  };

  /* Role + status aware primary action */
  const action = (() => {
    if (isCreator) {
      switch (gig.status) {
        case "FUNDED_IN_ESCROW":
          return gig.physicalProduct
            ? null // waiting on product
            : { label: "Start production", fn: () => app.transition(gig.id, "IN_PRODUCTION") };
        case "PRODUCT_DELIVERED":
          return { label: "Start production", fn: () => app.transition(gig.id, "IN_PRODUCTION") };
        case "IN_PRODUCTION":
        case "REVISION_REQUESTED":
          return {
            label: gig.status === "REVISION_REQUESTED" ? "Submit revision" : "Upload deliverable",
            icon: Upload,
            fn: () => {
              app.submitDeliverable(gig.id, `${gig.title.toLowerCase().slice(0, 18).replace(/[^a-z0-9]+/g, "-")}-v${deliverables.length + 1}.mp4`, 60 + Math.round(Math.random() * 40));
              toast("Deliverable submitted", { body: "Watermarked preview sent. Original unlocks at payout.", tone: "success" });
            },
          };
        default:
          return null;
      }
    }
    switch (gig.status) {
      case "OFFER_ACCEPTED":
        return {
          label: `Pay creator — ${formatMoney(gig.priceCents)}`,
          icon: ShieldCheck,
          money: true,
          fn: async () => {
            haptics.step();
            try {
              await payForGig({
                gigId: gig.id,
                title: gig.title,
                amountCents: gig.priceCents,
                creatorAccountId: creator?.stripePayoutsEnabled ? creator.stripeAccountId : undefined,
                creatorName: creator?.name,
              });
            } catch (e) {
              haptics.error();
              toast("Couldn’t start payment", {
                body: e instanceof Error ? e.message : "Try again in a moment.",
                tone: "warning",
              });
            }
          },
        };
      case "FUNDED_IN_ESCROW":
        return gig.physicalProduct
          ? {
              label: "Mark product shipped",
              icon: Truck,
              fn: () => {
                app.transition(gig.id, "PRODUCT_SHIPPED", { trackingNumber: trackingDraft || "1Z999AA10000000000" });
                toast("Tracking added", { body: "The deadline clock starts when delivery is confirmed.", tone: "info" });
              },
            }
          : null;
      case "PRODUCT_SHIPPED":
        return { label: "Confirm product delivered", icon: Package, fn: () => app.transition(gig.id, "PRODUCT_DELIVERED") };
      case "DELIVERED":
        return {
          label: `Approve work — ${formatMoney(creatorPayoutCents(gig.priceCents))}`,
          icon: CheckCircle2,
          money: true,
          fn: () => {
            app.approveAndRelease(gig.id);
            toast("Work approved", { body: `${creator?.name ?? "Creator"} receives ${formatMoney(creatorPayoutCents(gig.priceCents))}.`, tone: "success" });
          },
        };
      default:
        return null;
    }
  })();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/dashboard/gigs" className="rounded-full p-1.5 text-text-secondary hover:bg-surface-2" aria-label="Back to gigs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold sm:text-base">{gig.title}</h1>
            <p className="flex items-center gap-1.5 text-xs text-text-tertiary">
              <PlatformIcon platform={gig.platform} className="h-3 w-3" />
              {companyName} × {creator?.name ?? "Creator"}
            </p>
          </div>
          <StatusPill status={gig.status} />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-5 px-4 py-5 lg:grid-cols-[340px_1fr]">
        {/* LEFT: gig context */}
        <div className="space-y-4">
          {/* Counterparty */}
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              {isCreator ? (
                <>
                  <Avatar name={companyName} hue={companyHue} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{companyName}</p>
                    <p className="truncate text-xs text-text-tertiary">Brand workspace</p>
                  </div>
                </>
              ) : (
                <>
                  <Avatar name={creator?.name ?? "?"} hue={creator?.avatarHue ?? 0} src={creator?.avatarUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{creator?.name}</p>
                    <p className="text-xs text-text-tertiary">@{creator?.handle}</p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/creator/${creator?.handle}`}>View</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment timeline */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Payment status</p>
                <span className="num text-sm font-semibold">{formatMoney(gig.priceCents)}</span>
              </div>
              <ol className="space-y-0">
                {path.map((s, i) => {
                  const done = pathIdx >= i;
                  const current = pathIdx === i;
                  return (
                    <li key={s} className="flex gap-2.5">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[8px]",
                            done ? "border-money bg-money text-white" : "border-border-bright bg-surface",
                            current && "ring-2 ring-money/25",
                          )}
                        >
                          {done && <Check className="h-2.5 w-2.5" />}
                        </span>
                        {i < path.length - 1 && (
                          <span className={cn("w-px flex-1 min-h-3", done && pathIdx > i ? "bg-money" : "bg-border")} />
                        )}
                      </div>
                      <p className={cn("pb-2.5 text-[12px] leading-4", current ? "font-semibold" : done ? "text-text-secondary" : "text-text-tertiary")}>
                        {STATUS_LABELS[s]}
                        {s === "DELIVERED" && gig.status === "DELIVERED" && gig.deliveredAt && (
                          <span className="num block text-[10px] font-normal text-amber">
                            auto-approves in {AUTO_APPROVE_DAYS - Math.max(0, -daysUntil(gig.deliveredAt))}d
                          </span>
                        )}
                      </p>
                    </li>
                  );
                })}
              </ol>
              {["REVISION_REQUESTED", "DISPUTED", "CANCELLED"].includes(gig.status) && (
                <Badge variant={gig.status === "DISPUTED" ? "danger" : "amber"} className="mt-1">
                  {STATUS_LABELS[gig.status as GigStatus]}
                  {gig.status === "REVISION_REQUESTED" && ` · ${gig.revisionCount}/${MAX_REVISIONS}`}
                </Badge>
              )}
              <div className="mt-3 space-y-1 border-t border-border pt-3 text-[12px] text-text-secondary">
                <p className="flex justify-between">
                  <span>Deal Value</span>
                  <span className="num font-semibold">{formatMoney(gig.priceCents)}</span>
                </p>
                <p className="flex justify-between">
                  <span>Creator receives</span>
                  <span className="num font-semibold text-money">{formatMoney(creatorPayoutCents(gig.priceCents))}</span>
                </p>
                {!isCreator && (
                  <p className="flex justify-between text-text-tertiary">
                    <span>If cancelled now</span>
                    <span className="num">{refund.companyRefundPct}% refund</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Primary action */}
          {action && (
            <Button
              className="w-full"
              variant={"money" in action && action.money ? "money" : "default"}
              onClick={action.fn}
            >
              {"icon" in action && action.icon ? <action.icon className="h-4 w-4" /> : null}
              {action.label}
            </Button>
          )}
          {!isCreator && gig.status === "FUNDED_IN_ESCROW" && gig.physicalProduct && (
            <Input
              placeholder="Tracking number"
              className="num"
              value={trackingDraft}
              onChange={(e) => setTrackingDraft(e.target.value)}
            />
          )}
          {!isCreator && gig.status === "DELIVERED" && gig.revisionCount < MAX_REVISIONS && (
            <Button variant="outline" className="w-full" onClick={() => app.requestRevision(gig.id)}>
              Request revision ({gig.revisionCount}/{MAX_REVISIONS} used)
            </Button>
          )}
          {gig.status === "COMPLETED" && !myReview && (
            <Button variant="moneyOutline" className="w-full" onClick={() => setReviewOpen(true)}>
              <Star className="h-4 w-4" /> Leave a review
            </Button>
          )}

          {/* Contract */}
          {contract && (
            <Card interactive onClick={() => setContractOpen(true)}>
              <CardContent className="flex items-center gap-3 p-4">
                <FileSignature className="h-5 w-5 text-text-tertiary" />
                <div className="flex-1">
                  <p className="text-[13px] font-medium">Contract</p>
                  <p className="text-xs text-text-tertiary">
                    Signed {contract.companySignedAt ? formatDate(contract.companySignedAt) : "—"} · usage{" "}
                    <span className="num">{contract.terms.usageRightsDays}d</span>
                  </p>
                </div>
                <Badge variant="money"><Check className="h-3 w-3" /> Active</Badge>
              </CardContent>
            </Card>
          )}

          {/* Tracking */}
          {gig.trackingNumber && ["PRODUCT_SHIPPED", "PRODUCT_DELIVERED"].includes(gig.status) && (
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Truck className="h-5 w-5 text-text-tertiary" />
                <div>
                  <p className="text-[13px] font-medium">Product {gig.status === "PRODUCT_SHIPPED" ? "in transit" : "delivered"}</p>
                  <p className="num text-xs text-text-tertiary">{gig.trackingNumber}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deliverables */}
          {deliverables.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Deliverables</p>
                <div className="space-y-2">
                  {deliverables.map((d) => (
                    <div key={d.id} className="flex items-center gap-2.5 rounded-[8px] border border-border p-2.5">
                      <FileVideo className="h-4 w-4 shrink-0 text-text-tertiary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium">{d.fileName}</p>
                        <p className="num text-[11px] text-text-tertiary">v{d.version} · {d.sizeMb}MB</p>
                      </div>
                      {d.watermarked ? (
                        <Badge variant="amber"><Lock className="h-3 w-3" /> Watermarked</Badge>
                      ) : (
                        <Badge variant="money">Original</Badge>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-text-tertiary">
                  Previews stay watermarked until approval — originals unlock after payout.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Brief */}
          <Card>
            <CardContent className="p-4">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Brief</p>
              <p className="text-[13px] leading-relaxed text-text-secondary">{gig.brief}</p>
              {script && (
                <p className="mt-2.5 flex items-center gap-1.5 border-t border-border pt-2.5 text-xs text-ai">
                  <Sparkles className="h-3.5 w-3.5" /> AI script attached: {script.output.title}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: chat */}
        <Card className="flex min-h-[60vh] flex-col lg:max-h-[calc(100vh-7.5rem)]">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {msgs.length === 0 && (
              <p className="py-10 text-center text-[13px] text-text-tertiary">
                Start the conversation — offers and scripts you send become cards here.
              </p>
            )}
            {msgs.map((m) => {
              const mine = m.senderId === userId;
              const sender = m.senderId === gig.companyId
                ? { name: companyName, hue: companyHue, src: undefined }
                : (() => {
                    const c = app.creators.find((c) => c.id === m.senderId);
                    return { name: c?.name ?? "Creator", hue: c?.avatarHue ?? 0, src: c?.avatarUrl };
                  })();
              const msgScript = m.scriptId ? app.scripts.find((s) => s.id === m.scriptId) : null;
              return (
                <div key={m.id} className={cn("flex gap-2.5", mine && "flex-row-reverse")}>
                  <Avatar name={sender.name} hue={sender.hue} src={sender.src} size="xs" className="mt-1" />
                  <div className={cn("max-w-[85%] sm:max-w-[70%]", mine && "items-end")}>
                    {/* Text */}
                    {m.kind === "text" && (
                      <div className={cn("rounded-[12px] px-3.5 py-2.5 text-[13px] leading-relaxed", mine ? "bg-text-primary text-bg" : "bg-surface-2")}>
                        {m.text}
                      </div>
                    )}
                    {/* Attachment */}
                    {m.kind === "attachment" && (
                      <div className="rounded-[12px] border border-border bg-surface-2 px-3.5 py-2.5">
                        <p className="flex items-center gap-2 text-[13px] font-medium">
                          <Paperclip className="h-3.5 w-3.5" /> {m.attachmentName}
                        </p>
                        {m.text && <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{m.text}</p>}
                      </div>
                    )}
                    {/* Script card */}
                    {m.kind === "script" && msgScript && (
                      <div className="rounded-[12px] border border-ai/30 bg-ai-soft/50 p-3.5">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ai">
                          <Sparkles className="h-3.5 w-3.5" /> Script
                        </p>
                        <p className="mt-1 text-[13px] font-semibold">{msgScript.output.title}</p>
                        {msgScript.output.blocks?.slice(0, 1).map((b, i) => (
                          <p key={i} className="mt-1.5 text-[12px] leading-relaxed text-text-secondary">
                            <span className="num font-semibold text-ai">[{b.start}–{b.end} {b.label}]</span> {b.text}
                          </p>
                        ))}
                        <p className="mt-1.5 text-[11px] text-text-tertiary">
                          {msgScript.output.kind === "script"
                            ? `${msgScript.output.blocks?.length ?? 0} timed blocks`
                            : `${msgScript.output.bullets?.length ?? 0} brief bullets`} · open Scripts to view all
                        </p>
                      </div>
                    )}
                    {/* Offer card */}
                    {m.kind === "offer" && m.offer && (
                      <div className="w-72 max-w-full rounded-[12px] border border-border bg-surface p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">Offer</p>
                          {m.offer.state === "accepted" && <Badge variant="money"><Check className="h-3 w-3" /> Accepted</Badge>}
                          {m.offer.state === "declined" && <Badge variant="danger"><X className="h-3 w-3" /> Declined</Badge>}
                          {m.offer.state === "pending" && <Badge variant="amber">Pending</Badge>}
                        </div>
                        <p className="num mt-2 text-2xl font-semibold">{formatMoney(m.offer.priceCents)}</p>
                        <div className="mt-2 space-y-1 text-[12px] text-text-secondary">
                          <p>{m.offer.deliverables}</p>
                          <p>
                            Usage rights <span className="num font-medium">{m.offer.usageRightsDays}d</span>
                            {m.offer.rawFootageIncluded && " · raw footage included"}
                          </p>
                          <p className="text-text-tertiary">
                            Creator receives <span className="num font-medium text-money">{formatMoney(creatorPayoutCents(m.offer.priceCents))}</span>
                          </p>
                        </div>
                        {m.offer.state === "pending" && isCreator && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button
                              variant="money"
                              size="sm"
                              onClick={() => {
                                app.respondToOffer(m.id, true);
                                toast("Offer accepted", { body: "Contract generated. Waiting on the brand to pay.", tone: "success" });
                              }}
                            >
                              Accept
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => app.respondToOffer(m.id, false)}>
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    <p className={cn("num mt-1 text-[10px] text-text-tertiary", mine && "text-right")}>
                      {formatTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              {!isCreator && (
                <>
                  <Button variant="aiOutline" size="iconSm" onClick={() => setEngineOpen(true)} aria-label="AI script engine">
                    <Sparkles className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="iconSm" onClick={() => setOfferOpen(true)} aria-label="Send offer">
                    <FileSignature className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Textarea
                value={draft}
                onChange={(e) => {
                  haptics.tap();
                  setDraft(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={`Message ${isCreator ? companyName : creator?.name ?? "Creator"}…`}
                className="min-h-9 max-h-32 flex-1 py-2"
                rows={1}
              />
              <Button size="iconSm" onClick={send} disabled={!draft.trim()} aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-text-tertiary">
              Enter to send · offers, scripts, files, and payments stay attached to this gig
            </p>
          </div>
        </Card>
      </div>

      {/* Offer dialog */}
      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent>
          <DialogTitle>Send an offer</DialogTitle>
          <DialogDescription>Accepted offers auto-generate the contract.</DialogDescription>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (USD)</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">$</span>
                  <Input className="num pl-7" inputMode="numeric" value={offerPrice}
                    onChange={(e) => setOfferPrice(parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0)} />
                </div>
              </div>
              <div>
                <Label>Usage rights (days)</Label>
                <Input className="num mt-1.5" inputMode="numeric" value={offerUsage}
                  onChange={(e) => setOfferUsage(parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0)} />
              </div>
            </div>
            <div>
              <Label>Deliverables</Label>
              <Textarea className="mt-1.5 min-h-16" value={offerDeliverables} onChange={(e) => setOfferDeliverables(e.target.value)} />
            </div>
            <label className="flex cursor-pointer items-center justify-between rounded-[8px] border border-border p-3 text-sm">
              Raw footage included
              <input type="checkbox" checked={offerRaw} onChange={(e) => setOfferRaw(e.target.checked)} className="h-4 w-4 accent-[#3e7b5e]" />
            </label>
            <div className="rounded-[8px] bg-surface-2 p-3 text-[12px] text-text-secondary">
              <p className="flex justify-between"><span>Deal Value</span><span className="num font-semibold">{formatMoney(offerPrice * 100)}</span></p>
              <p className="flex justify-between"><span>Creator receives</span><span className="num font-semibold text-money">{formatMoney(creatorPayoutCents(offerPrice * 100))}</span></p>
            </div>
            <Button className="w-full" onClick={sendOffer}>Send offer — {formatMoney(offerPrice * 100)}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract dialog */}
      <Dialog open={contractOpen} onOpenChange={setContractOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogTitle className="font-serif">Content licensing agreement</DialogTitle>
          <DialogDescription>Generated automatically from the accepted offer — read-only.</DialogDescription>
          {contract && (
            <div className="mt-4 space-y-3 text-[13px] leading-relaxed">
              {[
                ["Parties", `${companyName} (“Brand”) and ${creator?.name ?? "Creator"} (“Creator”)`],
                ["Deliverables", contract.terms.deliverables],
                ["Compensation", `Deal Value: ${formatMoney(contract.terms.priceCents)} · Creator Receives: ${formatMoney(creatorPayoutCents(contract.terms.priceCents))}`],
                ["Usage rights", `${contract.terms.usageRightsDays} days of paid digital usage from approval${gig.usageExpiresAt ? `, expiring ${formatDate(gig.usageExpiresAt)}` : ""}. Both parties are reminded 7 days before expiry.`],
                ["Raw footage", contract.terms.rawFootageIncluded ? "Included with final delivery." : "Not included."],
                ["Exclusivity", contract.terms.exclusivity ? "Creator will not promote directly competing products for the usage period." : "None."],
                ["Revisions", `Up to ${MAX_REVISIONS} revision rounds; further requests escalate to dispute review.`],
                ["Auto-approval", `Deliverables auto-approve ${AUTO_APPROVE_DAYS} days after submission if the Brand takes no action.`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[8px] border border-border p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">{k}</p>
                  <p className="mt-1 text-text-secondary">{v}</p>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[8px] bg-surface-2 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-text-tertiary">Brand signed</p>
                  <p className="num mt-1 font-medium">{contract.companySignedAt ? formatDate(contract.companySignedAt) : "Pending"}</p>
                </div>
                <div className="rounded-[8px] bg-surface-2 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-text-tertiary">Creator signed</p>
                  <p className="num mt-1 font-medium">{contract.creatorSignedAt ? formatDate(contract.creatorSignedAt) : "Pending"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogTitle>Review {isCreator ? companyName : creator?.name}</DialogTitle>
          <DialogDescription>Reviews unlock only after completion and are public.</DialogDescription>
          <div className="mt-4 space-y-4">
            <StarPicker value={rating} onChange={setRating} />
            <div className="flex flex-wrap gap-1.5">
              {REVIEW_TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => setReviewTags(reviewTags.includes(t) ? reviewTags.filter((x) => x !== t) : [...reviewTags, t])}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                    reviewTags.includes(t) ? "border-text-primary bg-text-primary text-bg" : "border-border text-text-secondary",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <Textarea placeholder="What should the next partner know?" value={reviewBody} onChange={(e) => setReviewBody(e.target.value)} />
            <Button className="w-full" onClick={submitReview} disabled={reviewBody.length < 5}>
              Post review
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ScriptEngine
        open={engineOpen}
        onClose={() => setEngineOpen(false)}
        gigId={gig.id}
        onSendToChat={(scriptId) =>
          app.sendMessage({ gigId: gig.id, senderId: userId, kind: "script", scriptId })
        }
      />
    </div>
  );
}
