"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  canTransition,
  creatorPayoutCents,
  MAX_REVISIONS,
  platformFeeCents,
  refundPolicy,
} from "@/lib/gig-machine";
import {
  dbCancelGig,
  dbFundEscrow,
  dbInsertContract,
  dbInsertDeliverable,
  dbInsertGig,
  dbInsertReview,
  dbReleaseFunds,
  dbSendMessage,
  dbUpdateGig,
  dbUpdateOfferState,
  dbUpsertCreatorDetails,
} from "@/lib/sync";
import { useSession } from "@/lib/store/session";
import * as seed from "@/lib/seed";
import type {
  Contract,
  Creator,
  Deliverable,
  Gig,
  GigStatus,
  Message,
  MessageKind,
  Notification,
  OfferBody,
  Review,
  Transaction,
} from "@/lib/types";

let idCounter = 1000;
const uid = (p: string) => `${p}${idCounter++}_${Date.now().toString(36)}`;

function recomputeStats(creators: Creator[], reviews: Review[]): Creator[] {
  return creators.map((c) => {
    const received = reviews.filter((r) => r.targetId === c.id);
    if (!received.length) return c;
    const avg = received.reduce((sum, r) => sum + r.rating, 0) / received.length;
    return { ...c, rating: Math.round(avg * 10) / 10, reviewCount: received.length };
  });
}
const uuid = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : uid("m");
const now = () => new Date().toISOString();

interface LiveWorld {
  creators: Creator[];
  gigs: Gig[];
  messages: Message[];
  contracts: Contract[];
  deliverables: Deliverable[];
  transactions: Transaction[];
  reviews: Review[];
}

const emptyLiveState = () => ({
  creators: [] as Creator[],
  gigs: [] as Gig[],
  messages: [] as Message[],
  contracts: [] as Contract[],
  deliverables: [] as Deliverable[],
  transactions: [] as Transaction[],
  reviews: [] as Review[],
  notifications: [] as Notification[],
  // lastReadGigs intentionally omitted — persists across live/demo mode switch
});

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return Array.from(map.values());
}

interface AppState {
  creators: Creator[];
  gigs: Gig[];
  messages: Message[];
  contracts: Contract[];
  deliverables: Deliverable[];
  transactions: Transaction[];
  reviews: Review[];
  notifications: Notification[];
  lastReadGigs: Record<string, string>;

  enterLiveMode: () => void;
  setCreatorsFromDb: (creators: Creator[]) => void;
  setLiveWorld: (world: LiveWorld) => void;
  markGigRead: (gigId: string) => void;
  upsertGig: (gig: Gig) => void;
  upsertMessage: (message: Message) => void;
  updateCreator: (id: string, partial: Partial<Creator>) => void;
  /** Real (authed) users get a clean, zeroed creator record — no fake numbers. */
  ensureCreator: (id: string, partial?: Partial<Creator>) => void;
  sendMessage: (m: { gigId: string; senderId: string; kind: MessageKind; text?: string; attachmentName?: string; offer?: OfferBody }) => void;
  respondToOffer: (messageId: string, accept: boolean) => void;
  transition: (gigId: string, to: GigStatus, patch?: Partial<Gig>) => boolean;
  fundEscrow: (gigId: string, opts?: { sessionId?: string | null }) => Promise<void>;
  submitDeliverable: (gigId: string, url: string) => void;
  requestRevision: (gigId: string, comment?: string) => void;
  approveDraft: (gigId: string) => void;
  publishGig: (gigId: string, url: string) => void;
  approveAndRelease: (gigId: string) => Promise<void>;
  cancelGig: (gigId: string) => Promise<void>;
  createDraftGig: (creatorId: string) => Promise<string | null>;
  addReview: (r: Omit<Review, "id" | "createdAt">) => void;
  notify: (n: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markNotificationsRead: (userId: string) => void;
  resetDemo: () => void;
}

const seedState = () => ({
  creators: seed.creators,
  gigs: seed.gigs,
  messages: seed.messages,
  contracts: seed.contracts,
  deliverables: seed.deliverables,
  transactions: seed.transactions,
  reviews: seed.reviews,
  notifications: seed.notifications,
  lastReadGigs: {} as Record<string, string>,
});

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...seedState(),

      enterLiveMode: () => set(emptyLiveState()),

      setCreatorsFromDb: (creators) =>
        set((s) => ({
          creators: recomputeStats(mergeById(s.creators, creators), s.reviews),
        })),

      setLiveWorld: (world) =>
        set((s) => {
          // Merge all arrays so optimistic local rows (written but not yet
          // confirmed by the next poll) survive the 3-second refresh cycle.
          const contractMap = new Map(s.contracts.map((c) => [c.gigId, c]));
          for (const c of world.contracts) contractMap.set(c.gigId, c);
          const reviews = mergeById(s.reviews, world.reviews);
          const creators = recomputeStats(mergeById(s.creators, world.creators), reviews);
          return {
            gigs: mergeById(s.gigs, world.gigs),
            messages: mergeById(s.messages, world.messages),
            contracts: Array.from(contractMap.values()),
            deliverables: mergeById(s.deliverables, world.deliverables),
            transactions: world.transactions,
            reviews,
            creators,
          };
        }),

      markGigRead: (gigId) =>
        set((s) => ({
          lastReadGigs: { ...s.lastReadGigs, [gigId]: new Date().toISOString() },
        })),

      upsertGig: (gig) =>
        set((s) => ({
          gigs: mergeById(s.gigs, [gig]),
        })),

      upsertMessage: (message) =>
        set((s) => ({
          messages: mergeById(s.messages, [message]).sort((a, b) =>
            a.createdAt.localeCompare(b.createdAt),
          ),
        })),

      updateCreator: (id, partial) => {
        set((s) => ({
          creators: s.creators.map((c) => (c.id === id ? { ...c, ...partial } : c)),
        }));
        // Persist profile fields to Supabase so the 3-second poll doesn't overwrite local changes.
        const db: Parameters<typeof dbUpsertCreatorDetails>[0] = {};
        if (partial.bio !== undefined) db.bio = partial.bio;
        if (partial.status !== undefined) db.status = partial.status;
        if (partial.niches !== undefined) db.niches = partial.niches;
        if (partial.baseRateCents !== undefined) db.baseRateCents = partial.baseRateCents;
        if (partial.capacityPerWeek !== undefined) db.capacityPerWeek = partial.capacityPerWeek;
        if (partial.compensationPref !== undefined) db.compensationPref = partial.compensationPref;
        if (Object.keys(db).length > 0) void dbUpsertCreatorDetails(db);
      },

      ensureCreator: (id, partial) =>
        set((s) => {
          if (s.creators.some((c) => c.id === id)) {
            return partial
              ? { creators: s.creators.map((c) => (c.id === id ? { ...c, ...partial } : c)) }
              : {};
          }
          const blank: Creator = {
            id,
            handle: "",
            name: "Creator",
            avatarHue: Math.floor(Math.random() * 360),
            bio: "",
            location: "",
            status: "open",
            tier: "nano",
            platforms: [],
            niches: [],
            baseRateCents: 0,
            usageUpchargePct: 30,
            rawUpchargePct: 40,
            capacityPerWeek: 3,
            slotsBooked: 0,
            compensationPref: "product_plus",
            rating: 0,
            reviewCount: 0,
            completedGigs: 0,
            portfolio: [],
            joinedAt: now(),
            ...partial,
          };
          return { creators: [...s.creators, blank] };
        }),

      sendMessage: (m) => {
        const message: Message = { ...m, id: uuid(), createdAt: now() };
        get().upsertMessage(message);
        void dbSendMessage(message).then((saved) => {
          if (saved) get().upsertMessage(saved);
        });
      },

      respondToOffer: (messageId, accept) => {
        const msg = get().messages.find((m) => m.id === messageId);
        if (!msg?.offer) return;
        const updatedOffer: OfferBody = { ...msg.offer, state: accept ? "accepted" : "declined" };
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === messageId && m.offer
              ? { ...m, offer: updatedOffer }
              : m,
          ),
        }));
        void dbUpdateOfferState(messageId, updatedOffer);
        if (accept) {
          const gig = get().gigs.find((g) => g.id === msg.gigId);
          const offer = msg.offer;
          if (gig && canTransition(gig.status, "OFFER_ACCEPTED")) {
            // Auto-contract: generated from structured offer terms on acceptance
            const contract: Contract = {
              gigId: gig.id,
              terms: {
                deliverables: offer.deliverables,
                priceCents: offer.priceCents,
                usageRightsDays: offer.usageRightsDays,
                rawFootageIncluded: offer.rawFootageIncluded,
                exclusivity: false,
                platform: offer.platform ?? gig.platform,
                minPostLifetimeDays: offer.minPostLifetimeDays,
                revisionRounds: offer.revisionRounds,
                videoLengthSeconds: offer.videoLengthSeconds,
              },
              companySignedAt: now(),
              creatorSignedAt: now(),
            };
            set((s) => ({
              gigs: s.gigs.map((g) =>
                g.id === gig.id
                  ? {
                      ...g,
                      status: "OFFER_ACCEPTED" as GigStatus,
                      priceCents: offer.priceCents,
                      feeCents: platformFeeCents(offer.priceCents),
                      platform: offer.platform ?? g.platform,
                      rawFootage: offer.rawFootageIncluded,
                      usageDays: offer.usageRightsDays,
                      minPostLifetimeDays: offer.minPostLifetimeDays ?? g.minPostLifetimeDays,
                      revisionRounds: offer.revisionRounds ?? g.revisionRounds,
                      videoLengthSeconds: offer.videoLengthSeconds ?? g.videoLengthSeconds,
                    }
                  : g,
              ),
              contracts: [...s.contracts.filter((c) => c.gigId !== gig.id), contract],
            }));
            void dbUpdateGig(gig.id, {
              status: "OFFER_ACCEPTED",
              priceCents: offer.priceCents,
              platform: offer.platform ?? gig.platform,
              rawFootage: offer.rawFootageIncluded,
              usageDays: offer.usageRightsDays,
              minPostLifetimeDays: offer.minPostLifetimeDays,
              revisionRounds: offer.revisionRounds,
              videoLengthSeconds: offer.videoLengthSeconds,
            });
            void dbInsertContract(gig.id, contract.terms);
            get().notify({ userId: gig.companyId, title: "Offer accepted", body: "Contract generated — pay to start production.", href: `/gig/${gig.id}` });
          }
        }
      },

      transition: (gigId, to, patch) => {
        const gig = get().gigs.find((g) => g.id === gigId);
        if (!gig || !canTransition(gig.status, to)) return false;
        set((s) => ({
          gigs: s.gigs.map((g) => (g.id === gigId ? { ...g, ...patch, status: to } : g)),
        }));
        void dbUpdateGig(gigId, { ...patch, status: to });
        return true;
      },

      fundEscrow: async (gigId, opts) => {
        const gig = get().gigs.find((g) => g.id === gigId);
        if (!gig || !canTransition(gig.status, "FUNDED_IN_ESCROW")) return;
        // Live: the server verifies the payment and writes escrow durably. We
        // never persist money state from the client. Throw so the caller can
        // surface the failure; the poll reconciles state either way.
        if (!useSession.getState().isDemo) {
          const r = await dbFundEscrow({ gigId, sessionId: opts?.sessionId });
          if (!r.ok) throw new Error(r.error ?? "Could not confirm payment.");
        }
        const usageExpiresAt = new Date(Date.now() + gig.usageDays * 86_400_000).toISOString();
        set((s) => ({
          gigs: s.gigs.map((g) =>
            g.id === gigId ? { ...g, status: "FUNDED_IN_ESCROW" as GigStatus, usageExpiresAt } : g,
          ),
          transactions: [
            ...s.transactions,
            { id: uid("t"), gigId, type: "fund", amountCents: gig.priceCents, stripeRef: opts?.sessionId ?? `pi_demo_${gigId}`, createdAt: now() },
          ],
        }));
        get().notify({ userId: gig.creatorId, title: "Payment secured", body: "The brand paid — you're cleared to start.", href: `/gig/${gigId}` });
      },

      submitDeliverable: (gigId, url) => {
        const gig = get().gigs.find((g) => g.id === gigId);
        if (!gig || !canTransition(gig.status, "DELIVERED")) return;
        const version = get().deliverables.filter((d) => d.gigId === gigId).length + 1;
        const submittedAt = now();
        const fileName = `v${version} draft`;
        set((s) => ({
          gigs: s.gigs.map((g) =>
            g.id === gigId ? { ...g, status: "DELIVERED" as GigStatus, deliveredAt: submittedAt } : g,
          ),
          deliverables: [
            ...s.deliverables,
            { id: uid("d"), gigId, fileName, url, version, watermarked: true, submittedAt, sizeMb: 0 },
          ],
        }));
        void dbUpdateGig(gigId, { status: "DELIVERED", deliveredAt: submittedAt });
        void dbInsertDeliverable({ gigId, fileName: url, version });
        get().notify({ userId: gig.companyId, title: "Deliverable received", body: `Draft v${version} submitted for review. Auto-approves in 14 days.`, href: `/gig/${gigId}` });
      },

      requestRevision: (gigId, comment) => {
        const gig = get().gigs.find((g) => g.id === gigId);
        if (!gig || !canTransition(gig.status, "REVISION_REQUESTED")) return;
        const maxRounds = gig.revisionRounds ?? MAX_REVISIONS;
        // Surface the brand's feedback in the thread so the creator sees exactly
        // what to change.
        if (comment && comment.trim()) {
          get().sendMessage({
            gigId,
            senderId: gig.companyId,
            kind: "text",
            text: `Revision requested: ${comment.trim()}`,
          });
        }
        if (gig.revisionCount >= maxRounds) {
          // Out of revision rounds → auto-escalate to dispute review
          set((s) => ({
            gigs: s.gigs.map((g) => (g.id === gigId ? { ...g, status: "DISPUTED" as GigStatus } : g)),
          }));
          void dbUpdateGig(gigId, { status: "DISPUTED" });
          return;
        }
        set((s) => ({
          gigs: s.gigs.map((g) =>
            g.id === gigId
              ? { ...g, status: "REVISION_REQUESTED" as GigStatus, revisionCount: g.revisionCount + 1 }
              : g,
          ),
        }));
        void dbUpdateGig(gigId, {
          status: "REVISION_REQUESTED",
          revisionCount: gig.revisionCount + 1,
        });
        get().notify({ userId: gig.creatorId, title: "Revision requested", body: `Revision ${gig.revisionCount + 1} of ${maxRounds} on "${gig.title}".`, href: `/gig/${gigId}` });
      },

      /** Brand approves the DRAFT — creator is cleared to publish. No money moves. */
      approveDraft: (gigId) => {
        const gig = get().gigs.find((g) => g.id === gigId);
        if (!gig || !canTransition(gig.status, "APPROVED")) return;
        set((s) => ({
          gigs: s.gigs.map((g) => (g.id === gigId ? { ...g, status: "APPROVED" as GigStatus } : g)),
        }));
        void dbUpdateGig(gigId, { status: "APPROVED" });
        get().notify({ userId: gig.creatorId, title: "Draft approved", body: `Publish "${gig.title}" and drop the live link to get paid.`, href: `/gig/${gigId}` });
      },

      /** Creator publishes to the platform and submits the live post link. */
      publishGig: (gigId, url) => {
        const gig = get().gigs.find((g) => g.id === gigId);
        if (!gig || !canTransition(gig.status, "PUBLISHED")) return;
        const publishedAt = now();
        set((s) => ({
          gigs: s.gigs.map((g) =>
            g.id === gigId
              ? { ...g, status: "PUBLISHED" as GigStatus, publishedUrl: url, publishedAt }
              : g,
          ),
        }));
        void dbUpdateGig(gigId, { status: "PUBLISHED", publishedUrl: url, publishedAt });
        get().sendMessage({
          gigId,
          senderId: gig.creatorId,
          kind: "text",
          text: `Published — live here: ${url}`,
        });
        get().notify({ userId: gig.companyId, title: "Post is live", body: `${gig.title} was published. Approve the live post to release payment.`, href: `/gig/${gigId}` });
      },

      /** Brand approves the live post → server releases escrow (fee + payout), unlocks files. */
      approveAndRelease: async (gigId) => {
        const gig = get().gigs.find((g) => g.id === gigId);
        if (!gig || !canTransition(gig.status, "COMPLETED")) return;
        // Live: the server is the sole authority for releasing money — it
        // verifies the caller is the brand, derives the payout from the amount
        // actually escrowed, and writes the ledger + creator balance.
        if (!useSession.getState().isDemo) {
          const r = await dbReleaseFunds(gigId);
          if (!r.ok) throw new Error(r.error ?? "Could not release payment.");
        }
        const fee = platformFeeCents(gig.priceCents);
        const payout = creatorPayoutCents(gig.priceCents);
        const completedAt = now();
        set((s) => ({
          gigs: s.gigs.map((g) =>
            g.id === gigId ? { ...g, status: "COMPLETED" as GigStatus, feeCents: fee, completedAt } : g,
          ),
          transactions: [
            ...s.transactions,
            { id: uid("t"), gigId, type: "fee", amountCents: fee, stripeRef: `fee_demo_${gigId}`, createdAt: now() },
            { id: uid("t"), gigId, type: "release", amountCents: payout, stripeRef: `tr_demo_${gigId}`, createdAt: now() },
          ],
          deliverables: s.deliverables.map((d) =>
            d.gigId === gigId ? { ...d, watermarked: false } : d,
          ),
        }));
        get().notify({ userId: gig.creatorId, title: "Work approved", body: "Payout is on its way and reviews are now unlocked for this gig.", href: `/dashboard/wallet` });
      },

      cancelGig: async (gigId) => {
        const gig = get().gigs.find((g) => g.id === gigId);
        if (!gig || !canTransition(gig.status, "CANCELLED")) return;
        if (!useSession.getState().isDemo) {
          const r = await dbCancelGig(gigId);
          if (!r.ok) throw new Error(r.error ?? "Could not cancel gig.");
        }
        const funded = get().transactions.some((t) => t.gigId === gigId && t.type === "fund");
        const { companyRefundPct } = refundPolicy(gig.status);
        const refundCents = Math.round((gig.priceCents * companyRefundPct) / 100);
        set((s) => ({
          gigs: s.gigs.map((g) => (g.id === gigId ? { ...g, status: "CANCELLED" as GigStatus } : g)),
          transactions: funded && refundCents > 0
            ? [...s.transactions, { id: uid("t"), gigId, type: "refund" as const, amountCents: refundCents, stripeRef: `re_demo_${gigId}`, createdAt: now() }]
            : s.transactions,
        }));
      },

      /**
       * Start a fresh gig with a creator from inside a chat. The company is the
       * current user; the gig opens as DRAFT so an offer can be sent on it.
       */
      createDraftGig: async (creatorId) => {
        const companyId = useSession.getState().userId;
        if (!companyId) return null;
        const isDemo = useSession.getState().isDemo;
        const base: Gig = {
          id: uuid(),
          companyId,
          creatorId,
          status: "DRAFT",
          title: "New gig",
          brief: "",
          platform: "tiktok",
          priceCents: 0,
          feeCents: 0,
          usageDays: 90,
          rawFootage: false,
          physicalProduct: false,
          revisionCount: 0,
          createdAt: now(),
          minPostLifetimeDays: 30,
          revisionRounds: 2,
        };
        if (!isDemo) {
          const saved = await dbInsertGig(base);
          if (!saved) return null;
          get().upsertGig(saved);
          return saved.id;
        }
        set((s) => ({ gigs: [...s.gigs, base] }));
        return base.id;
      },

      addReview: (r) => {
        const review: Review = { ...r, id: uuid(), createdAt: now() };
        set((s) => {
          const reviews = mergeById(s.reviews, [review]);
          return { reviews, creators: recomputeStats(s.creators, reviews) };
        });
        void dbInsertReview(review);
      },

      notify: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: uid("n"), read: false, createdAt: now() },
            ...s.notifications,
          ],
        })),

      markNotificationsRead: (userId) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.userId === userId ? { ...n, read: true } : n,
          ),
        })),

      resetDemo: () => set(seedState()),
    }),
    { name: "loop-demo-data", version: 6, migrate: (state) => (state ?? seedState()) as never },
  ),
);

/** SSR-safe hydration gate — show skeletons until the persisted store is ready. */
import { useEffect, useState } from "react";
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
