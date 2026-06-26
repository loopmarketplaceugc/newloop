import type { Gig, GigStatus } from "./types";

/**
 * Platform commission, adjustable via NEXT_PUBLIC_PLATFORM_FEE_PCT (default 10%).
 * Loop keeps this cut of every gig; the rest goes to the creator.
 */
export const PLATFORM_FEE_PCT: number = (() => {
  const raw = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PCT);
  return Number.isFinite(raw) && raw >= 0 && raw <= 90 ? raw : 10;
})();
export const PLATFORM_FEE_RATE = PLATFORM_FEE_PCT / 100;
export const MAX_REVISIONS = 2;
export const AUTO_APPROVE_DAYS = 14;
export const USAGE_REMINDER_DAYS = 7;

/** Single source of truth for legal transitions of `gig.status`. */
const TRANSITIONS: Record<GigStatus, GigStatus[]> = {
  DRAFT: ["OFFER_SENT", "CANCELLED"],
  OFFER_SENT: ["OFFER_ACCEPTED", "CANCELLED"],
  OFFER_ACCEPTED: ["FUNDED_IN_ESCROW", "CANCELLED"],
  FUNDED_IN_ESCROW: ["PRODUCT_SHIPPED", "IN_PRODUCTION", "CANCELLED", "DISPUTED"],
  PRODUCT_SHIPPED: ["PRODUCT_DELIVERED", "DISPUTED"],
  PRODUCT_DELIVERED: ["IN_PRODUCTION", "DISPUTED"],
  IN_PRODUCTION: ["DELIVERED", "DISPUTED", "CANCELLED"],
  DELIVERED: ["APPROVED", "REVISION_REQUESTED", "DISPUTED"],
  REVISION_REQUESTED: ["DELIVERED", "DISPUTED"],
  APPROVED: ["PAID_OUT"],
  PAID_OUT: ["COMPLETED"],
  COMPLETED: [],
  DISPUTED: ["CANCELLED", "APPROVED"],
  CANCELLED: [],
};

export function canTransition(from: GigStatus, to: GigStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: GigStatus): GigStatus[] {
  return TRANSITIONS[from];
}

/** Platform commission (PLATFORM_FEE_PCT%), deducted automatically at payout. */
export function platformFeeCents(priceCents: number): number {
  return Math.round(priceCents * PLATFORM_FEE_RATE);
}

export function creatorPayoutCents(priceCents: number): number {
  return priceCents - platformFeeCents(priceCents);
}

export const STATUS_LABELS: Record<GigStatus, string> = {
  DRAFT: "Draft",
  OFFER_SENT: "Offer sent",
  OFFER_ACCEPTED: "Offer accepted",
  FUNDED_IN_ESCROW: "Payment secured",
  PRODUCT_SHIPPED: "Product shipped",
  PRODUCT_DELIVERED: "Product delivered",
  IN_PRODUCTION: "In production",
  DELIVERED: "Delivered",
  REVISION_REQUESTED: "Revision requested",
  APPROVED: "Approved",
  PAID_OUT: "Paid out",
  COMPLETED: "Completed",
  DISPUTED: "Disputed",
  CANCELLED: "Cancelled",
};

export type StatusToneName = "neutral" | "emerald" | "amber" | "danger";

/** emerald is reserved for money/success states only */
export const STATUS_TONES: Record<GigStatus, StatusToneName> = {
  DRAFT: "neutral",
  OFFER_SENT: "neutral",
  OFFER_ACCEPTED: "neutral",
  FUNDED_IN_ESCROW: "emerald",
  PRODUCT_SHIPPED: "neutral",
  PRODUCT_DELIVERED: "neutral",
  IN_PRODUCTION: "neutral",
  DELIVERED: "amber",
  REVISION_REQUESTED: "amber",
  APPROVED: "emerald",
  PAID_OUT: "emerald",
  COMPLETED: "emerald",
  DISPUTED: "danger",
  CANCELLED: "neutral",
};

/** Kanban lanes for the dashboard active-gigs board. */
export const KANBAN_LANES: { label: string; statuses: GigStatus[] }[] = [
  { label: "Invited", statuses: ["DRAFT", "OFFER_SENT", "OFFER_ACCEPTED"] },
  {
    label: "Paid",
    statuses: ["FUNDED_IN_ESCROW", "PRODUCT_SHIPPED", "PRODUCT_DELIVERED"],
  },
  { label: "In Production", statuses: ["IN_PRODUCTION", "REVISION_REQUESTED"] },
  { label: "Delivered", statuses: ["DELIVERED"] },
  { label: "Approved", statuses: ["APPROVED", "PAID_OUT", "COMPLETED"] },
];

/** Payment has been secured in these states. */
export const ESCROW_HELD_STATUSES: GigStatus[] = [
  "FUNDED_IN_ESCROW",
  "PRODUCT_SHIPPED",
  "PRODUCT_DELIVERED",
  "IN_PRODUCTION",
  "DELIVERED",
  "REVISION_REQUESTED",
  "APPROVED",
];

export const ACTIVE_STATUSES: GigStatus[] = [
  "OFFER_SENT",
  "OFFER_ACCEPTED",
  "FUNDED_IN_ESCROW",
  "PRODUCT_SHIPPED",
  "PRODUCT_DELIVERED",
  "IN_PRODUCTION",
  "DELIVERED",
  "REVISION_REQUESTED",
  "APPROVED",
];

export function isEscrowHeld(gig: Gig): boolean {
  return ESCROW_HELD_STATUSES.includes(gig.status);
}

/** Refund rules per stage on cancellation. */
export function refundPolicy(status: GigStatus): {
  companyRefundPct: number;
  note: string;
} {
  switch (status) {
    case "FUNDED_IN_ESCROW":
    case "PRODUCT_SHIPPED":
    case "PRODUCT_DELIVERED":
      return { companyRefundPct: 100, note: "Full refund — production has not started." };
    case "IN_PRODUCTION":
      return { companyRefundPct: 50, note: "50% kill fee — production underway." };
    case "DELIVERED":
    case "REVISION_REQUESTED":
      return { companyRefundPct: 0, note: "No refund after delivery — open a dispute instead." };
    default:
      return { companyRefundPct: 100, note: "No payment captured yet." };
  }
}

/** Ordered main-path steps for the payment timeline UI. */
export function mainPath(physicalProduct: boolean): GigStatus[] {
  return [
    "OFFER_SENT",
    "OFFER_ACCEPTED",
    "FUNDED_IN_ESCROW",
    ...(physicalProduct ? (["PRODUCT_SHIPPED", "PRODUCT_DELIVERED"] as GigStatus[]) : []),
    "IN_PRODUCTION",
    "DELIVERED",
    "APPROVED",
    "PAID_OUT",
    "COMPLETED",
  ];
}
