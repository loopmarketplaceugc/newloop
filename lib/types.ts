export type Role = "creator" | "company";

export type Platform = "tiktok" | "reels" | "shorts";

export const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: "TikTok",
  reels: "Instagram Reels",
  shorts: "YouTube Shorts",
};

export type Tier = "nano" | "micro" | "mid" | "elite";

export const TIER_LABELS: Record<Tier, string> = {
  nano: "Nano",
  micro: "Micro",
  mid: "Mid",
  elite: "Elite",
};

/** Nano <10k · Micro 10–50k · Mid 50–250k · Elite 250k+ */
export function tierForFollowers(followers: number): Tier {
  if (followers >= 250_000) return "elite";
  if (followers >= 50_000) return "mid";
  if (followers >= 10_000) return "micro";
  return "nano";
}

export type CompensationPref = "paid_only" | "product_ok" | "product_plus";

export const COMPENSATION_LABELS: Record<CompensationPref, string> = {
  paid_only: "Paid only",
  product_ok: "Product exchange OK",
  product_plus: "Product + payment",
};

export const NICHES = [
  "beauty",
  "food",
  "tech",
  "fitness",
  "fashion",
  "SaaS",
  "local",
  "home",
  "pets",
  "travel",
  "finance",
  "parenting",
] as const;

export type Niche = (typeof NICHES)[number];

export type CreatorStatus = "open" | "busy" | "away";

export interface PlatformPresence {
  platform: Platform;
  url: string;
  followerCount: number;
  postCount?: number;
  averageViews?: number;
}

export interface PortfolioItem {
  id: string;
  type: "video" | "photo";
  title: string;
  thumbnailHue: number; // demo placeholder gradient hue
  durationSec?: number;
}

export interface Creator {
  id: string;
  handle: string;
  name: string;
  avatarHue: number;
  avatarUrl?: string;
  bio: string;
  location: string;
  status: CreatorStatus;
  tier: Tier;
  platforms: PlatformPresence[];
  niches: Niche[];
  baseRateCents: number;
  usageUpchargePct: number;
  rawUpchargePct: number;
  capacityPerWeek: number;
  slotsBooked: number;
  compensationPref: CompensationPref;
  rating: number; // 0–5
  reviewCount: number;
  completedGigs: number;
  portfolio: PortfolioItem[];
  mediaKitUrl?: string;
  joinedAt: string;
  /** Unique MCC creator tag minted at certification, e.g. "MCC-7K2P-9QX4". */
  mccTag?: string;
  /** Stripe Connect (Express) account id once the creator sets up payouts. */
  stripeAccountId?: string;
  /** Whether Stripe has cleared the creator to receive payouts. */
  stripePayoutsEnabled?: boolean;
}

export interface Company {
  id: string;
  name: string;
  website: string;
  niche: Niche;
  budgetRange: string;
  logoHue: number;
  about: string;
}

export const GIG_STATUSES = [
  "DRAFT",
  "OFFER_SENT",
  "OFFER_ACCEPTED",
  "FUNDED_IN_ESCROW",
  "PRODUCT_SHIPPED",
  "PRODUCT_DELIVERED",
  "IN_PRODUCTION",
  "DELIVERED",
  "REVISION_REQUESTED",
  "APPROVED",
  "PAID_OUT",
  "COMPLETED",
  "DISPUTED",
  "CANCELLED",
] as const;

export type GigStatus = (typeof GIG_STATUSES)[number];

export interface ContractTerms {
  deliverables: string;
  priceCents: number;
  usageRightsDays: number;
  rawFootageIncluded: boolean;
  exclusivity: boolean;
}

export interface Contract {
  gigId: string;
  terms: ContractTerms;
  companySignedAt?: string;
  creatorSignedAt?: string;
}

export interface Deliverable {
  id: string;
  gigId: string;
  fileName: string;
  version: number;
  watermarked: boolean;
  submittedAt: string;
  sizeMb: number;
}

export interface Gig {
  id: string;
  companyId: string;
  creatorId: string;
  status: GigStatus;
  title: string;
  brief: string;
  platform: Platform;
  priceCents: number;
  feeCents: number;
  usageDays: number;
  usageExpiresAt?: string;
  rawFootage: boolean;
  physicalProduct: boolean;
  trackingNumber?: string;
  deadline?: string;
  deliveredAt?: string;
  revisionCount: number;
  createdAt: string;
  scriptId?: string;
}

export interface OfferBody {
  priceCents: number;
  deliverables: string;
  usageRightsDays: number;
  rawFootageIncluded: boolean;
  state: "pending" | "accepted" | "declined";
}

export type MessageKind = "text" | "attachment" | "script" | "offer";

export interface Message {
  id: string;
  gigId: string;
  senderId: string;
  kind: MessageKind;
  text?: string;
  attachmentName?: string;
  scriptId?: string;
  offer?: OfferBody;
  createdAt: string;
}

export type ScriptTone = "chaotic" | "aesthetic" | "educational" | "testimonial";

export const TONE_LABELS: Record<ScriptTone, string> = {
  chaotic: "Chaotic",
  aesthetic: "Aesthetic",
  educational: "Educational",
  testimonial: "Testimonial",
};

export type ScriptKind = "script" | "brief";

export interface ScriptInputs {
  productName: string;
  productDescription: string;
  audience: string;
  tone: ScriptTone;
  platform: Platform;
  kind: ScriptKind;
}

export interface ScriptBlock {
  start: string; // "0:00"
  end: string; // "0:03"
  label: "HOOK" | "BODY" | "CTA";
  text: string;
}

export interface ScriptOutput {
  kind: ScriptKind;
  title: string;
  blocks?: ScriptBlock[]; // full script
  bullets?: string[]; // brief
}

export interface ScriptDoc {
  id: string;
  companyId: string;
  gigId?: string;
  inputs: ScriptInputs;
  output: ScriptOutput;
  createdAt: string;
}

export type TransactionType = "fund" | "release" | "refund" | "fee";

export interface Transaction {
  id: string;
  gigId: string;
  type: TransactionType;
  amountCents: number;
  stripeRef: string;
  createdAt: string;
}

export interface Review {
  id: string;
  gigId: string;
  authorId: string;
  targetId: string;
  rating: number;
  tags: string[];
  body: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

export interface EarningsPoint {
  date: string; // ISO
  cumulativeCents: number;
}
