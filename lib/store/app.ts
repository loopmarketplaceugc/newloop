"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  canTransition,
  creatorPayoutCents,
  MAX_REVISIONS,
  platformFeeCents,
} from "@/lib/gig-machine";
import {
  dbInsertContract,
  dbInsertDeliverable,
  dbSendMessage,
  dbUpdateGig,
  dbUpdateOfferState,
} from "@/lib/sync";
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
  ScriptDoc,
  Transaction,
} from "@/lib/types";

let idCounter = 1000;
const uid = (p: string) => `${p}${idCounter++}_${Date.now().toString(36)}`;
const uuid = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : uid("m");
const now = () => new Date().toISOString();

interface LiveWorld {
  creators: Creator[];
  gigs: Gig[];
  messages: Message[];
  deliverables: Deliverable[];
  transactions: Transaction[];
}

const emptyLiveState = () => ({
  creators: [] as Creator[],
  gigs: [] as Gig[],
  messages: [] as Message[],
  contracts: [] as Contract[],
  deliverables: [] as Deliverable[],
  transactions: [] as Transaction[],
  reviews: [] as Review[],
  scripts: [] as ScriptDoc[],
  notifications: [] as Notification[],
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
  scripts: ScriptDoc[];
  notifications: Notification[];

  enterLiveMode: () => void;
  setCreatorsFromDb: (creators: Creator[]) => void;
  setLiveWorld: (world: LiveWorld) => void;
  upsertGig: (gig: Gig) => void;
  upsertMessage: (message: Message) => void;
  updateCreator: (id: string, partial: Partial<Creator>) => void;
  /** Real (authed) users get a clean, zeroed creator record — no fake numbers. */
  ensureCreator: (id: string, partial?: Partial<Creator>) => void;
  sendMessage: (m: { gigId: string; senderId: string; kind: MessageKind; text?: string; attachmentName?: string; scriptId?: string; offer?: OfferBody }) => void;
  respondToOffer: (messageId: string, accept: boolean) => void;
  transition: (gigId: string, to: GigStatus, patch?: Partial<Gig>) => boolean;
  fundEscrow: (gigId: string) => void;
  submitDeliverable: (gigId: string, fileName: string, sizeMb: number) => void;
  requestRevision: (gigId: string) => void;
  approveAndRelease: (gigId: string) => void;
  cancelGig: (gigId: string) => void;
  addScript: (doc: ScriptDoc) => void;
  attachScriptToGig: (scriptId: string, gigId: string) => void;
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
  scripts: seed.scripts,
  notifications: seed.notifications,
});

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...emptyLiveState(),

      enterLiveMode: () => set(emptyLiveState()),

      setCreatorsFromDb: (creators) => set({ creators }),

      setLiveWorld: (world) =>
        set((s) => ({
          gigs: world.gigs,
          messages: world.messages,
          deliverables: world.deliverables,
          transactions: world.transactions,
          creators: mergeById(s.creators, world.creators),
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

      updateCreator: (id, partial) =>
        set((s) => ({
          creators: s.creators.map((c) => (c.id === id ? { ...c, ...partial } : c)),
        })),

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
          if (gig && canTransition(gig.status, "OFFER_ACCEPTED")) {
            // Auto-contract: generated from structured offer terms on acceptance
            const contract: Contract = {
              gigId: gig.id,
              terms: {
                deliverables: msg.offer.deliverables,
                priceCents: msg.offer.priceCents,
                usageRightsDays: msg.offer.usageRightsDays,
                rawFootageIncluded: msg.offer.rawFootageIncluded,
                exclusivity: false,
              },
              companySignedAt: now(),
              creatorSignedAt: now(),
            };
            set((s) => ({
              gigs: s.gigs.map((g) =>
                g.id === gig.id
                  ? { ...g, status: "OFFER_ACCEPTED" as GigStatus, priceCents: msg.offer!.priceCents, feeCents: platformFeeCents(msg.offer!.priceCents) }
                  : g,
              ),
              contracts: [...s.contracts.filter((c) => c.gigId !== gig.id), contract],
            }));
            void dbUpdateGig(gig.id, {
              status: "OFFER_ACCEPTED",
              priceCents: msg.offer.priceCents,
            });
            void dbInsertContract(gig.id, contract.terms);
            get().notify({ userId: gig.companyId, title: "Offer accepted", body: "Contract generated — fund escrow to start production.", href: `/gig/${gig.id}` });
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

      fundEscrow: (gigId) => {
        const gig = get().gigs.find((g) => g.id === gigId);
        if (!gig || !canTransition(gig.status, "FUNDED_IN_ESCROW")) return;
        const usageExpiresAt = new Date(Date.now() + gig.usageDays * 86_400_000).toISOString();
        set((s) => ({
          gigs: s.gigs.map((g) =>
            g.id === gigId ? { ...g, status: "FUNDED_IN_ESCROW" as GigStatus, usageExpiresAt } : g,
          ),
          transactions: [
            ...s.transactions,
            { id: uid("t"), gigId, type: "fund", amountCents: gig.priceCents, stripeRef: `pi_demo_${gigId}`, createdAt: now() },
          ],
        }));
        void dbUpdateGig(gigId, { status: "FUNDED_IN_ESCROW", usageExpiresAt });
        get().notify({ userId: gig.creatorId, title: "Escrow funded", body: `${"Funds are held"} — you're cleared to start.`, href: `/gig/${gigId}` });
      },

      submitDeliverable: (gigId, fileName, sizeMb) => {
        const gig = get().gigs.find((g) => g.id === gigId);
        if (!gig || !canTransition(gig.status, "DELIVERED")) return;
        const version = get().deliverables.filter((d) => d.gigId === gigId).length + 1;
        const submittedAt = now();
        set((s) => ({
          gigs: s.gigs.map((g) =>
            g.id === gigId ? { ...g, status: "DELIVERED" as GigStatus, deliveredAt: submittedAt } : g,
          ),
          deliverables: [
            ...s.deliverables,
            { id: uid("d"), gigId, fileName, version, watermarked: true, submittedAt, sizeMb },
          ],
        }));
        void dbUpdateGig(gigId, { status: "DELIVERED", deliveredAt: submittedAt });
        void dbInsertDeliverable({ gigId, fileName, version });
        get().notify({ userId: gig.companyId, title: "Deliverable received", body: `${fileName} is ready for review. Auto-approves in 14 days.`, href: `/gig/${gigId}` });
      },

      requestRevision: (gigId) => {
        const gig = get().gigs.find((g) => g.id === gigId);
        if (!gig || !canTransition(gig.status, "REVISION_REQUESTED")) return;
        if (gig.revisionCount >= MAX_REVISIONS) {
          // Max 2 revisions, then auto-escalate to dispute review
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
        get().notify({ userId: gig.creatorId, title: "Revision requested", body: `Revision ${gig.revisionCount + 1} of ${MAX_REVISIONS} on "${gig.title}".`, href: `/gig/${gigId}` });
      },

      /** APPROVED → fee + release transactions → PAID_OUT → COMPLETED, watermark unlocked. */
      approveAndRelease: (gigId) => {
        const gig = get().gigs.find((g) => g.id === gigId);
        if (!gig || !canTransition(gig.status, "APPROVED")) return;
        const fee = platformFeeCents(gig.priceCents);
        const payout = creatorPayoutCents(gig.priceCents);
        set((s) => ({
          gigs: s.gigs.map((g) =>
            g.id === gigId ? { ...g, status: "COMPLETED" as GigStatus, feeCents: fee } : g,
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
        void dbUpdateGig(gigId, { status: "COMPLETED", priceCents: gig.priceCents });
        get().notify({ userId: gig.creatorId, title: "Payment released", body: `Escrow released. Reviews are now unlocked for this gig.`, href: `/dashboard/wallet` });
      },

      cancelGig: (gigId) => {
        const gig = get().gigs.find((g) => g.id === gigId);
        if (!gig || !canTransition(gig.status, "CANCELLED")) return;
        const funded = get().transactions.some((t) => t.gigId === gigId && t.type === "fund");
        set((s) => ({
          gigs: s.gigs.map((g) => (g.id === gigId ? { ...g, status: "CANCELLED" as GigStatus } : g)),
          transactions: funded
            ? [...s.transactions, { id: uid("t"), gigId, type: "refund" as const, amountCents: gig.priceCents, stripeRef: `re_demo_${gigId}`, createdAt: now() }]
            : s.transactions,
        }));
        void dbUpdateGig(gigId, { status: "CANCELLED" });
      },

      addScript: (doc) => set((s) => ({ scripts: [doc, ...s.scripts] })),

      attachScriptToGig: (scriptId, gigId) =>
        set((s) => ({
          scripts: s.scripts.map((sc) => (sc.id === scriptId ? { ...sc, gigId } : sc)),
          gigs: s.gigs.map((g) => (g.id === gigId ? { ...g, scriptId } : g)),
        })),

      addReview: (r) =>
        set((s) => ({
          reviews: [...s.reviews, { ...r, id: uid("r"), createdAt: now() }],
        })),

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
    { name: "mcc-demo-data", version: 5, migrate: () => ({ ...emptyLiveState() }) as never },
  ),
);

/** SSR-safe hydration gate — show skeletons until the persisted store is ready. */
import { useEffect, useState } from "react";
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
