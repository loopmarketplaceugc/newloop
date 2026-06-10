"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  canTransition,
  creatorPayoutCents,
  MAX_REVISIONS,
  platformFeeCents,
} from "@/lib/gig-machine";
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
const now = () => new Date().toISOString();

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
      ...seedState(),

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

      sendMessage: (m) =>
        set((s) => ({
          messages: [...s.messages, { ...m, id: uid("m"), createdAt: now() }],
        })),

      respondToOffer: (messageId, accept) => {
        const msg = get().messages.find((m) => m.id === messageId);
        if (!msg?.offer) return;
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === messageId && m.offer
              ? { ...m, offer: { ...m.offer, state: accept ? "accepted" : "declined" } }
              : m,
          ),
        }));
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
        get().notify({ userId: gig.creatorId, title: "Escrow funded", body: `${"Funds are held"} — you're cleared to start.`, href: `/gig/${gigId}` });
      },

      submitDeliverable: (gigId, fileName, sizeMb) => {
        const gig = get().gigs.find((g) => g.id === gigId);
        if (!gig || !canTransition(gig.status, "DELIVERED")) return;
        const version = get().deliverables.filter((d) => d.gigId === gigId).length + 1;
        set((s) => ({
          gigs: s.gigs.map((g) =>
            g.id === gigId ? { ...g, status: "DELIVERED" as GigStatus, deliveredAt: now() } : g,
          ),
          deliverables: [
            ...s.deliverables,
            { id: uid("d"), gigId, fileName, version, watermarked: true, submittedAt: now(), sizeMb },
          ],
        }));
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
          return;
        }
        set((s) => ({
          gigs: s.gigs.map((g) =>
            g.id === gigId
              ? { ...g, status: "REVISION_REQUESTED" as GigStatus, revisionCount: g.revisionCount + 1 }
              : g,
          ),
        }));
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
    { name: "mcc-demo-data", version: 4, migrate: () => ({ ...seedState() }) as never },
  ),
);

/** SSR-safe hydration gate — show skeletons until the persisted store is ready. */
import { useEffect, useState } from "react";
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
