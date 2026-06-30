"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileSignature,
  FileVideo,
  Package,
  Paperclip,
  Plus,
  Rocket,
  Send,
  ShieldCheck,
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
import { HoldTimeline } from "@/components/gig/hold-timeline";
import { companyById } from "@/lib/seed";
import { fetchMyWorld, fetchProfileNames, subscribeToGig } from "@/lib/sync";
import { haptics } from "@/lib/haptics";
import { payForGig } from "@/lib/payments";
import {
  AUTO_APPROVE_DAYS,
  MAX_REVISIONS,
  STATUS_LABELS,
  creatorPayoutCents,
  effectiveStatus,
  mainPath,
  refundPolicy,
} from "@/lib/gig-machine";
import { daysUntil, formatDate, formatMoney, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS, type GigStatus, type Platform } from "@/lib/types";

const REVIEW_TAGS = ["on-time", "great communication", "exceeded brief", "fast approval", "clear brief", "would rehire"];

export default function GigWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const role = useSession((s) => s.role);
  const isDemo = useSession((s) => s.isDemo);
  const app = useApp();
  const [draft, setDraft] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "details" | "contract">("chat");
  const [gigPanelOpen, setGigPanelOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [deliverableOpen, setDeliverableOpen] = useState(false);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishUrl, setPublishUrl] = useState("");
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionComment, setRevisionComment] = useState("");
  const [trackingDraft, setTrackingDraft] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [offerPrice, setOfferPrice] = useState(450);
  const [offerDeliverables, setOfferDeliverables] = useState("1 × 30s vertical video");
  const [offerUsage, setOfferUsage] = useState(90);
  const [offerRaw, setOfferRaw] = useState(false);
  const [offerPlatform, setOfferPlatform] = useState<Platform>("tiktok");
  const [offerVideoLen, setOfferVideoLen] = useState(30);
  const [offerMinLifetime, setOfferMinLifetime] = useState(30);
  const [offerRevisions, setOfferRevisions] = useState(2);
  const [profileNames, setProfileNames] = useState<Record<string, { name: string; hue: number }>>({});
  const [liveChecked, setLiveChecked] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const markGigRead = useApp((s) => s.markGigRead);
  const gig = app.gigs.find((g) => g.id === id);
  const msgs = app.messages.filter((m) => m.gigId === id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [msgs.length, hydrated]);

  // Mark this gig as read whenever we're viewing it and messages update.
  useEffect(() => {
    if (userId && id) markGigRead(id);
  }, [id, msgs.length, userId, markGigRead]);

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
          // Server verifies the payment with Stripe and records the hold durably.
          if (gig.status === "OFFER_ACCEPTED") {
            await useApp.getState().fundHold(gig.id, { sessionId });
          }
          haptics.success();
          toast("Payment locked", {
            body: "Funds are locked and held securely — the creator is cleared to start.",
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
    // Realtime subscription covers this gig's messages/status; the poll backstops
    // other-gig updates and reconnects after brief network gaps.
    const timer = window.setInterval(() => void refresh(), 15000);

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
  const isCreator = role === "creator";
  const canSendOffer = !msgs.some((m) => m.kind === "offer" && m.offer?.state !== "declined");
  const myReview = app.reviews.find((r) => r.gigId === gig.id && r.authorId === userId);
  const path = mainPath(gig.physicalProduct);
  const pathIdx = path.indexOf(gig.status as (typeof path)[number]);
  const refund = refundPolicy(gig.status);
  const shownStatus = effectiveStatus(gig);
  const maxRounds = gig.revisionRounds ?? MAX_REVISIONS;
  // Every gig shared with this same counterparty — powers the gig switcher.
  const relatedGigs = app.gigs
    .filter((g) => g.companyId === gig.companyId && g.creatorId === gig.creatorId)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const send = () => {
    if (!draft.trim()) return;
    haptics.select();
    app.sendMessage({ gigId: gig.id, senderId: userId, kind: "text", text: draft.trim() });
    setDraft("");
  };

  const sendOffer = () => {
    if (!Number.isFinite(offerPrice) || offerPrice <= 0) {
      toast("Set a price first", { body: "Enter an amount greater than $0 before sending the offer.", tone: "warning" });
      return;
    }
    app.sendMessage({
      gigId: gig.id,
      senderId: userId,
      kind: "offer",
      offer: {
        priceCents: Math.round(offerPrice) * 100,
        deliverables: offerDeliverables,
        usageRightsDays: offerUsage,
        rawFootageIncluded: offerRaw,
        state: "pending",
        platform: offerPlatform,
        minPostLifetimeDays: offerMinLifetime,
        revisionRounds: offerRevisions,
        videoLengthSeconds: offerVideoLen,
      },
    });
    if (gig.status === "DRAFT") app.transition(gig.id, "OFFER_SENT");
    setOfferOpen(false);
    toast("Offer sent", { body: "The creator can accept or decline right in the chat.", tone: "success" });
  };

  // Start a brand-new gig with the same creator, from inside this chat.
  const startNewGig = async () => {
    const newId = await app.createDraftGig(gig.creatorId);
    if (!newId) {
      toast("Couldn’t start a new gig", { body: "Try again in a moment.", tone: "warning" });
      return;
    }
    router.push(`/gig/${newId}`);
    setTimeout(() => setOfferOpen(true), 350);
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
            label: gig.status === "REVISION_REQUESTED" ? "Resubmit" : "Submit draft link",
            icon: Upload,
            fn: () => {
              setDeliverableUrl("");
              setDeliverableOpen(true);
            },
          };
        case "APPROVED":
          return {
            label: "Publish & submit link",
            icon: Rocket,
            fn: () => {
              setPublishUrl(gig.publishedUrl ?? "");
              setPublishOpen(true);
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
              const result = await payForGig({ gigId: gig.id });
              // Fully paid from pre-loaded balance — no redirect happened, so
              // reflect the funded state locally; the live poll reconciles details.
              if (result.funded) {
                app.transition(gig.id, "FUNDED_IN_ESCROW");
                haptics.success();
                toast("Payment locked", {
                  body: "Paid from your Loop balance — the creator is cleared to start.",
                  tone: "success",
                });
              }
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
        // Approving the draft moves NO money — it clears the creator to publish.
        return {
          label: "Approve draft",
          icon: CheckCircle2,
          fn: () => {
            app.approveDraft(gig.id);
            haptics.success();
            toast("Draft approved", { body: `${creator?.name ?? "Creator"} can now publish and submit the live link.`, tone: "success" });
          },
        };
      case "PUBLISHED":
        // Approving the LIVE post is what releases payment.
        return {
          label: `Approve live post — ${formatMoney(creatorPayoutCents(gig.priceCents))}`,
          icon: CheckCircle2,
          money: true,
          fn: async () => {
            try {
              await app.approveAndRelease(gig.id);
              haptics.success();
              toast("Live post approved", { body: `${creator?.name ?? "Creator"} receives ${formatMoney(creatorPayoutCents(gig.priceCents))}.`, tone: "success" });
            } catch (e) {
              haptics.error();
              toast("Couldn’t release payment", { body: e instanceof Error ? e.message : "Try again shortly.", tone: "warning" });
            }
          },
        };
      default:
        return null;
    }
  })();

  // A short note when the current user is waiting on the other party.
  const waitingNote = (() => {
    if (isCreator) {
      if (gig.status === "DELIVERED") return "Submitted — waiting on the brand to review your draft.";
      if (gig.status === "PUBLISHED") return "Live link sent — waiting on the brand to approve and release payment.";
      if (gig.status === "OFFER_ACCEPTED") return "Waiting on the brand to fund the gig before you start.";
    } else {
      if (gig.status === "APPROVED") return "Draft approved — waiting on the creator to publish and send the live link.";
      if (gig.status === "IN_PRODUCTION") return "Creator is producing the video.";
    }
    return null;
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
          <StatusPill status={shownStatus} />
        </div>
      </header>

      {/* Mobile: primary action bar — surfaces key action without scrolling */}
      {(action || waitingNote) && (
        <div className="lg:hidden border-b border-border bg-bg/95 px-4 py-3 space-y-2 backdrop-blur-sm">
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
          {waitingNote && (
            <p className="text-center text-[12px] leading-relaxed text-text-secondary">{waitingNote}</p>
          )}
        </div>
      )}

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-5 px-4 py-5 lg:grid-cols-[340px_1fr]">
        {/* LEFT: gig context — shows below chat on mobile, left column on desktop */}
        <div className="order-2 space-y-4 lg:order-1">
          {/* Gig panel — persistent list of all gigs with this counterparty */}
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                Gigs with {isCreator ? companyName : creator?.name ?? "Creator"}
              </p>
              <div className="space-y-2">
                {(gigPanelOpen || relatedGigs.length <= 3
                  ? relatedGigs
                  : relatedGigs.slice(0, 3)
                ).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => { if (g.id !== gig.id) router.push(`/gig/${g.id}`); }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-[10px] border p-2.5 text-left transition-all",
                      g.id === gig.id
                        ? "cursor-default border-ink bg-surface-2"
                        : "cursor-pointer border-border hover:border-border-bright hover:bg-surface-2/50",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold">{g.title}</p>
                      <p className="num text-[10px] text-text-tertiary">{formatMoney(g.priceCents)}</p>
                    </div>
                    <StatusPill status={effectiveStatus(g)} />
                  </button>
                ))}
              </div>
              {relatedGigs.length > 3 && (
                <button
                  type="button"
                  onClick={() => setGigPanelOpen((o) => !o)}
                  className="mt-2 text-[11px] font-medium text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  {gigPanelOpen ? "Show less" : `+${relatedGigs.length - 3} more`}
                </button>
              )}
              {!isCreator && (
                <button
                  type="button"
                  onClick={() => void startNewGig()}
                  className="mt-3 flex w-full items-center gap-1.5 rounded-[8px] border border-dashed border-border px-3 py-2 text-[12px] font-semibold text-money transition-colors hover:border-money/50 hover:bg-surface-2/40"
                >
                  <Plus className="h-3.5 w-3.5" /> New gig with {creator?.name ?? "this creator"}
                </button>
              )}
            </CardContent>
          </Card>

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
                  {gig.status === "REVISION_REQUESTED" && ` · ${gig.revisionCount}/${maxRounds}`}
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
          {!isCreator && gig.status === "DELIVERED" && gig.revisionCount < maxRounds && (
            <Button variant="outline" className="w-full" onClick={() => { setRevisionComment(""); setRevisionOpen(true); }}>
              Request revision ({gig.revisionCount}/{maxRounds} used)
            </Button>
          )}
          {gig.status === "DISPUTED" && (
            <div className="space-y-2 rounded-[12px] border border-red-400/40 bg-red-500/5 p-4">
              <p className="text-[13px] font-semibold text-red-500">This gig is in dispute</p>
              <p className="text-[12px] leading-relaxed text-text-secondary">
                {isCreator
                  ? "Loop support is reviewing this gig. The brand can clear you to publish, or Loop will resolve it."
                  : "Loop support resolves disputes — funds can't be self-refunded once work is in dispute. You can clear the creator to publish, or our team will review and decide."}
              </p>
              {!isCreator && (
                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    className="w-full"
                    onClick={() => {
                      app.approveDraft(gig.id);
                      haptics.success();
                      toast("Dispute resolved", { body: `${creator?.name ?? "Creator"} can now publish.`, tone: "success" });
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Clear creator to publish
                  </Button>
                  <p className="text-[11px] leading-relaxed text-text-tertiary">
                    Need a refund instead? Email{" "}
                    <a href="mailto:legal@loop.so" className="underline underline-offset-2">legal@loop.so</a>{" "}
                    and Loop will review the dispute.
                  </p>
                </div>
              )}
            </div>
          )}
          {waitingNote && (
            <p className="rounded-[10px] border border-border bg-surface-2/60 px-3.5 py-2.5 text-[12px] leading-relaxed text-text-secondary">
              {waitingNote}
            </p>
          )}
          {/* Live post link */}
          {gig.publishedUrl && ["PUBLISHED", "COMPLETED", "EXPIRED"].includes(shownStatus) && (
            <a
              href={gig.publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-[12px] border border-border bg-surface p-4 transition-colors hover:border-border-bright"
            >
              <ExternalLink className="h-5 w-5 shrink-0 text-text-tertiary" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">Live post</p>
                <p className="truncate text-xs text-text-tertiary">{gig.publishedUrl}</p>
              </div>
            </a>
          )}
          {shownStatus === "COMPLETED" && gig.completedAt && gig.minPostLifetimeDays != null && (
            <p className="text-center text-[11px] text-text-tertiary">
              Must stay live until {formatDate(new Date(new Date(gig.completedAt).getTime() + gig.minPostLifetimeDays * 86_400_000).toISOString())}
            </p>
          )}
          {(shownStatus === "COMPLETED" || shownStatus === "EXPIRED") && !myReview && (
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
                  {deliverables.map((d) =>
                    d.url ? (
                      <a
                        key={d.id}
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 rounded-[8px] border border-border p-2.5 transition-colors hover:border-border-bright"
                      >
                        <FileVideo className="h-4 w-4 shrink-0 text-text-tertiary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium text-money">{d.fileName}</p>
                          <p className="num text-[11px] text-text-tertiary">v{d.version}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 shrink-0 text-text-tertiary" />
                      </a>
                    ) : (
                      <div key={d.id} className="flex items-center gap-2.5 rounded-[8px] border border-border p-2.5">
                        <FileVideo className="h-4 w-4 shrink-0 text-text-tertiary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium">{d.fileName}</p>
                          <p className="num text-[11px] text-text-tertiary">v{d.version}</p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Brief */}
          <Card>
            <CardContent className="p-4">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Brief</p>
              <p className="text-[13px] leading-relaxed text-text-secondary">{gig.brief}</p>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: workspace tabs — first on mobile, right column on desktop */}
        <Card className="relative order-1 flex min-h-[60vh] flex-col lg:order-2 lg:max-h-[calc(100vh-7.5rem)]">
          {/* Tab bar */}
          <div className="flex shrink-0 gap-0.5 border-b border-border px-3 pt-2">
            {(["chat", "details", "contract"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-t-[6px] px-3.5 py-2 text-[13px] font-semibold capitalize transition-colors",
                  activeTab === tab
                    ? "bg-surface-2 text-text-primary"
                    : "text-text-tertiary hover:text-text-secondary",
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* ── Chat tab ── */}
          {activeTab === "chat" && (
            <>
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4"
                onScroll={() => {
                  const el = chatContainerRef.current;
                  if (!el) return;
                  setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
                }}
              >
                {msgs.length === 0 && (
                  <p className="py-10 text-center text-[13px] text-text-tertiary">
                    Start the conversation — offers and files you send become cards here.
                  </p>
                )}
                {msgs.map((m, i) => {
                  const mine = m.senderId === userId;
                  const sender =
                    m.senderId === gig.companyId
                      ? { name: companyName, hue: companyHue, src: undefined }
                      : (() => {
                          const c = app.creators.find((c) => c.id === m.senderId);
                          return { name: c?.name ?? "Creator", hue: c?.avatarHue ?? 0, src: c?.avatarUrl };
                        })();
                  const prevDate = i > 0 ? new Date(msgs[i - 1].createdAt).toDateString() : null;
                  const showDivider = new Date(m.createdAt).toDateString() !== prevDate;
                  const dayLbl = (() => {
                    const d = new Date(m.createdAt);
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    if (d.toDateString() === today.toDateString()) return "Today";
                    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  })();
                  return (
                    <div key={m.id}>
                      {showDivider && (
                        <div className="flex items-center gap-3 py-3">
                          <div className="flex-1 border-t border-border" />
                          <span className="text-[11px] font-medium text-text-tertiary">{dayLbl}</span>
                          <div className="flex-1 border-t border-border" />
                        </div>
                      )}
                      <div className={cn("flex items-end gap-2.5 py-0.5", mine && "flex-row-reverse")}>
                        {!mine ? (
                          <Avatar name={sender.name} hue={sender.hue} src={sender.src} size="xs" className="mb-0.5 shrink-0" />
                        ) : (
                          <div className="w-5 shrink-0" />
                        )}
                        <div className={cn("flex min-w-0 max-w-[85%] flex-col gap-0.5 sm:max-w-[70%]", mine ? "items-end" : "items-start")}>
                          {/* Text */}
                          {m.kind === "text" && (
                            <div
                              className={cn(
                                "w-full break-words rounded-[18px] px-4 py-2.5 text-[13px] leading-relaxed",
                                mine
                                  ? "rounded-br-[4px] bg-ink text-[#faf6ef]"
                                  : "rounded-bl-[4px] border border-border bg-surface-2",
                              )}
                            >
                              {m.text}
                            </div>
                          )}
                          {/* Attachment */}
                          {m.kind === "attachment" && (
                            <div className="max-w-[85%] rounded-[12px] border border-border bg-surface-2 px-3.5 py-2.5 sm:max-w-[70%]">
                              <p className="flex items-center gap-2 text-[13px] font-medium">
                                <Paperclip className="h-3.5 w-3.5" /> {m.attachmentName}
                              </p>
                              {m.text && <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{m.text}</p>}
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
                                {(m.offer.platform || m.offer.videoLengthSeconds) && (
                                  <p>
                                    {m.offer.platform ? PLATFORM_LABELS[m.offer.platform] : ""}
                                    {m.offer.videoLengthSeconds ? `${m.offer.platform ? " · " : ""}${m.offer.videoLengthSeconds}s video` : ""}
                                  </p>
                                )}
                                <p>
                                  Usage rights <span className="num font-medium">{m.offer.usageRightsDays}d</span>
                                  {m.offer.minPostLifetimeDays ? (
                                    <> · stays live <span className="num font-medium">{m.offer.minPostLifetimeDays}d</span></>
                                  ) : null}
                                  {m.offer.rawFootageIncluded && " · raw footage included"}
                                </p>
                                {m.offer.revisionRounds != null && (
                                  <p>{m.offer.revisionRounds} revision round{m.offer.revisionRounds === 1 ? "" : "s"}</p>
                                )}
                                <p className="text-text-tertiary">
                                  Creator receives{" "}
                                  <span className="num font-medium text-money">{formatMoney(creatorPayoutCents(m.offer.priceCents))}</span>
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
                          <p className={cn("num text-[10px] text-text-tertiary", mine && "text-right")}>
                            {formatTime(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Scroll-to-latest button */}
              {showScrollBtn && (
                <button
                  type="button"
                  onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="absolute bottom-[72px] right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface shadow-md transition-all hover:bg-surface-2"
                  aria-label="Scroll to latest"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}

              {/* Composer */}
              <div className="shrink-0 border-t border-border p-3">
                <div className="flex items-end gap-2">
                  {!isCreator && (
                    <>
                      {canSendOffer && (
                        <Button variant="outline" size="iconSm" onClick={() => { setOfferPlatform(gig.platform); setOfferOpen(true); }} aria-label="Send offer">
                          <FileSignature className="h-4 w-4" />
                        </Button>
                      )}
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
                {draft.length > 200 && (
                  <p className="mt-1 text-right text-[10px] text-text-tertiary">
                    <span className={cn("num", draft.length > 500 && "text-amber")}>{draft.length}</span> chars
                  </p>
                )}
                {draft.length <= 200 && (
                  <p className="mt-1.5 text-[10px] text-text-tertiary">
                    Enter to send · offers, files, and payments stay attached to this gig
                  </p>
                )}
              </div>
            </>
          )}

          {/* ── Details tab ── */}
          {activeTab === "details" && (
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {([
                  ["Deal Value", formatMoney(gig.priceCents), false],
                  ["Creator Receives", formatMoney(creatorPayoutCents(gig.priceCents)), true],
                  gig.platform ? ["Platform", PLATFORM_LABELS[gig.platform], false] : null,
                  gig.videoLengthSeconds ? ["Video length", `${gig.videoLengthSeconds}s`, false] : null,
                  ["Revision rounds", String(maxRounds), false],
                  ["Usage rights", `${gig.usageDays}d`, false],
                  gig.minPostLifetimeDays != null ? ["Min. live", `${gig.minPostLifetimeDays}d`, false] : null,
                  ["Raw footage", gig.rawFootage ? "Included" : "Not included", false],
                  gig.deadline ? ["Deadline", formatDate(gig.deadline), false] : null,
                ] as ([string, string, boolean] | null)[])
                  .filter((x): x is [string, string, boolean] => x !== null)
                  .map(([label, value, highlight]) => (
                    <div key={label} className="rounded-[10px] border border-border bg-surface p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">{label}</p>
                      <p className={cn("mt-1 text-sm font-semibold", highlight && "text-money")}>{value}</p>
                    </div>
                  ))}
              </div>
              <div>
                <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Timeline</p>
                <HoldTimeline
                  gig={
                    shownStatus === "EXPIRED"
                      ? { ...gig, status: "COMPLETED" as const }
                      : gig
                  }
                />
              </div>
              {gig.publishedUrl && (
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Live post</p>
                  <a
                    href={gig.publishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-[12px] border border-border bg-surface p-3.5 transition-colors hover:border-border-bright"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0 text-text-tertiary" />
                    <p className="truncate text-[13px] text-money">{gig.publishedUrl}</p>
                  </a>
                </div>
              )}
              {deliverables.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Deliverables</p>
                  <div className="space-y-2">
                    {deliverables.map((d) =>
                      d.url ? (
                        <a
                          key={d.id}
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 rounded-[8px] border border-border p-2.5 transition-colors hover:border-border-bright"
                        >
                          <FileVideo className="h-4 w-4 shrink-0 text-text-tertiary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-medium text-money">{d.fileName}</p>
                            <p className="num text-[11px] text-text-tertiary">v{d.version}</p>
                          </div>
                          <ExternalLink className="h-4 w-4 shrink-0 text-text-tertiary" />
                        </a>
                      ) : (
                        <div key={d.id} className="flex items-center gap-2.5 rounded-[8px] border border-border p-2.5">
                          <FileVideo className="h-4 w-4 shrink-0 text-text-tertiary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-medium">{d.fileName}</p>
                            <p className="num text-[11px] text-text-tertiary">v{d.version}</p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Contract tab ── */}
          {activeTab === "contract" && (
            <div className="flex-1 overflow-y-auto p-4">
              {contract ? (
                <div className="space-y-3 text-[13px] leading-relaxed">
                  {([
                    ["Parties", `${companyName} ("Brand") and ${creator?.name ?? "Creator"} ("Creator")`],
                    ["Deliverables", `${contract.terms.deliverables}${contract.terms.videoLengthSeconds ? ` · ${contract.terms.videoLengthSeconds}s` : ""}${contract.terms.platform ? ` on ${PLATFORM_LABELS[contract.terms.platform]}` : ""}`],
                    ["Compensation", `Deal Value: ${formatMoney(contract.terms.priceCents)} · Creator Receives: ${formatMoney(creatorPayoutCents(contract.terms.priceCents))}`],
                    ["Usage rights", `${contract.terms.usageRightsDays} days of paid digital usage from approval${gig.usageExpiresAt ? `, expiring ${formatDate(gig.usageExpiresAt)}` : ""}. Both parties are reminded 7 days before expiry.`],
                    ["Minimum post lifetime", `The published post must stay live for at least ${contract.terms.minPostLifetimeDays ?? gig.minPostLifetimeDays ?? 30} days after going live.`],
                    ["Raw footage", contract.terms.rawFootageIncluded ? "Included with final delivery." : "Not included."],
                    ["Exclusivity", contract.terms.exclusivity ? "Creator will not promote directly competing products for the usage period." : "None."],
                    ["Revisions", `Up to ${contract.terms.revisionRounds ?? maxRounds} revision rounds; further requests escalate to dispute review.`],
                    ["Publishing", "After the Brand approves the draft, the Creator publishes to the platform and submits the live link. Payment is released only once the Brand approves the live post."],
                    ["Auto-approval", `Deliverables auto-approve ${AUTO_APPROVE_DAYS} days after submission if the Brand takes no action.`],
                  ] as [string, string][]).map(([k, v]) => (
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
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileSignature className="mb-3 h-10 w-10 text-text-tertiary" />
                  <p className="font-serif text-base font-semibold">No contract yet</p>
                  <p className="mt-1.5 max-w-xs text-[13px] text-text-secondary">
                    Accept an offer to automatically generate the contract.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Offer dialog */}
      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent>
          <DialogTitle>Send an offer</DialogTitle>
          <DialogDescription>Accepted offers auto-generate the contract.</DialogDescription>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Platform</Label>
              <div className="mt-1.5 flex gap-2">
                {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setOfferPlatform(p)}
                    className={cn(
                      "flex-1 rounded-[8px] border px-2 py-2 text-[12px] font-medium transition-colors cursor-pointer",
                      offerPlatform === p ? "border-text-primary bg-text-primary text-bg" : "border-border text-text-secondary hover:border-border-bright",
                    )}
                  >
                    {PLATFORM_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
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
                <Label>Video length (seconds)</Label>
                <Input className="num mt-1.5" inputMode="numeric" value={offerVideoLen}
                  onChange={(e) => setOfferVideoLen(parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Usage (days)</Label>
                <Input className="num mt-1.5" inputMode="numeric" value={offerUsage}
                  onChange={(e) => setOfferUsage(parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0)} />
              </div>
              <div>
                <Label>Min. live (days)</Label>
                <Input className="num mt-1.5" inputMode="numeric" value={offerMinLifetime}
                  onChange={(e) => setOfferMinLifetime(parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0)} />
              </div>
              <div>
                <Label>Revisions</Label>
                <Input className="num mt-1.5" inputMode="numeric" value={offerRevisions}
                  onChange={(e) => setOfferRevisions(parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0)} />
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
            <Button className="w-full" onClick={sendOffer} disabled={offerPrice <= 0}>Send offer — {formatMoney(offerPrice * 100)}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deliverable URL dialog — creator submits a link to the draft video */}
      <Dialog open={deliverableOpen} onOpenChange={setDeliverableOpen}>
        <DialogContent>
          <DialogTitle>{gig.status === "REVISION_REQUESTED" ? "Resubmit deliverable" : "Submit draft link"}</DialogTitle>
          <DialogDescription>
            Paste a link to your draft video (Google Drive, Dropbox, Frame.io, etc.). The brand
            can open and review it right here.
          </DialogDescription>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Video URL</Label>
              <Input
                className="mt-1.5"
                placeholder="https://"
                value={deliverableUrl}
                onChange={(e) => setDeliverableUrl(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={!/^https?:\/\/.+/.test(deliverableUrl.trim())}
              onClick={() => {
                const wasRevision = gig.status === "REVISION_REQUESTED";
                app.submitDeliverable(gig.id, deliverableUrl.trim());
                setDeliverableOpen(false);
                setDeliverableUrl("");
                haptics.success();
                toast(wasRevision ? "Resubmitted" : "Draft submitted", { body: "Link sent for review. Auto-approves in 14 days.", tone: "success" });
              }}
            >
              <Upload className="h-4 w-4" /> {gig.status === "REVISION_REQUESTED" ? "Resubmit" : "Submit draft link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish dialog — creator submits the live post link */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogTitle>Publish &amp; submit your live link</DialogTitle>
          <DialogDescription>
            Post the approved video to {PLATFORM_LABELS[gig.platform]}, then paste the public link. The brand
            approves the live post to release your payment.
          </DialogDescription>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Live post URL</Label>
              <Input
                className="mt-1.5"
                placeholder="https://"
                value={publishUrl}
                onChange={(e) => setPublishUrl(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={!/^https?:\/\/.+/.test(publishUrl.trim())}
              onClick={() => {
                app.publishGig(gig.id, publishUrl.trim());
                setPublishOpen(false);
                haptics.success();
                toast("Link submitted", { body: "The brand can now approve your live post.", tone: "success" });
              }}
            >
              <Rocket className="h-4 w-4" /> Submit live link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revision dialog — brand leaves feedback */}
      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent>
          <DialogTitle>Request a revision</DialogTitle>
          <DialogDescription>
            Round {gig.revisionCount + 1} of {maxRounds}. Tell the creator exactly what to change — it posts to the chat.
          </DialogDescription>
          <div className="mt-4 space-y-4">
            <Textarea
              className="min-h-24"
              placeholder="What needs to change?"
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={revisionComment.trim().length < 3}
              onClick={() => {
                app.requestRevision(gig.id, revisionComment.trim());
                setRevisionOpen(false);
                haptics.step();
                toast("Revision requested", { body: "The creator has your notes.", tone: "info" });
              }}
            >
              Send revision request
            </Button>
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
                ["Deliverables", `${contract.terms.deliverables}${contract.terms.videoLengthSeconds ? ` · ${contract.terms.videoLengthSeconds}s` : ""}${contract.terms.platform ? ` on ${PLATFORM_LABELS[contract.terms.platform]}` : ""}`],
                ["Compensation", `Deal Value: ${formatMoney(contract.terms.priceCents)} · Creator Receives: ${formatMoney(creatorPayoutCents(contract.terms.priceCents))}`],
                ["Usage rights", `${contract.terms.usageRightsDays} days of paid digital usage from approval${gig.usageExpiresAt ? `, expiring ${formatDate(gig.usageExpiresAt)}` : ""}. Both parties are reminded 7 days before expiry.`],
                ["Minimum post lifetime", `The published post must stay live for at least ${contract.terms.minPostLifetimeDays ?? gig.minPostLifetimeDays ?? 30} days after going live.`],
                ["Raw footage", contract.terms.rawFootageIncluded ? "Included with final delivery." : "Not included."],
                ["Exclusivity", contract.terms.exclusivity ? "Creator will not promote directly competing products for the usage period." : "None."],
                ["Revisions", `Up to ${contract.terms.revisionRounds ?? maxRounds} revision rounds; further requests escalate to dispute review.`],
                ["Publishing", "After the Brand approves the draft, the Creator publishes to the platform and submits the live link. Payment is released only once the Brand approves the live post."],
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

    </div>
  );
}
