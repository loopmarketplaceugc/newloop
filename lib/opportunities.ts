export interface ViewBonus {
  trigger: string;
  amountCents: number;
  capCents: number;
}

export interface Opportunity {
  id: string;
  companyId: string;
  brand: string;
  niche: string;
  campaign: string;
  brief: string;
  platform: string;
  deliverables: string;
  videoLength: string;
  trend: string;
  idea: string;
  script: string;
  basePayCents: number;
  viewBonus: ViewBonus;
}

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "demo-nike-run",
    companyId: "brand-nike",
    brand: "Nike",
    niche: "fitness",
    campaign: "Run Club shoe drop",
    brief: "Show one everyday run: lace up, first sprint, post-run fit check, and one honest comfort note.",
    platform: "TikTok + Instagram Reels",
    deliverables: "2 vertical reels",
    videoLength: "15-25 seconds each",
    trend: "fit-check transition + pace overlay",
    idea: "Make it feel like a creator diary, not a polished ad.",
    script: "Hook: 'I tested the running shoe I keep seeing everywhere.' Beat 1: pain point. Beat 2: three run clips. CTA: 'Would you train in these?'",
    basePayCents: 65000,
    viewBonus: { trigger: "every 50k verified views", amountCents: 10000, capCents: 50000 },
  },
  {
    id: "demo-glossier-grwm",
    companyId: "brand-glossier",
    brand: "Glossier",
    niche: "beauty",
    campaign: "Everyday glow GRWM",
    brief: "Film a real morning routine with texture shots, no filter, and a natural-light final look.",
    platform: "TikTok",
    deliverables: "1 reel + 3 raw clips",
    videoLength: "30-40 seconds",
    trend: "GRWM voiceover + soft close-up cuts",
    idea: "The angle is 'products I actually keep on my counter.'",
    script: "Hook: 'This is my five-minute face when I do not want to look tired.' Show product texture, one application tip, final mirror check.",
    basePayCents: 52000,
    viewBonus: { trigger: "every 25k verified views", amountCents: 7500, capCents: 45000 },
  },
  {
    id: "demo-chipotle-lunch",
    companyId: "brand-chipotle",
    brand: "Chipotle",
    niche: "food",
    campaign: "Desk lunch order hack",
    brief: "Build a lunch order, show the first bite, and explain why it works for busy workdays.",
    platform: "Instagram Reels",
    deliverables: "2 reels",
    videoLength: "12-18 seconds each",
    trend: "POV lunch break + quick-cut order build",
    idea: "Use a fast, satisfying edit: bowl build, bite, rating, price-value line.",
    script: "Hook: 'My $12 desk lunch that does not make me sleepy.' Beat 1: order build. Beat 2: bite reaction. CTA: 'Drop your go-to order.'",
    basePayCents: 40000,
    viewBonus: { trigger: "every 40k verified views", amountCents: 8000, capCents: 40000 },
  },
  {
    id: "demo-duolingo-streak",
    companyId: "brand-duolingo",
    brand: "Duolingo",
    niche: "SaaS",
    campaign: "Seven-day streak challenge",
    brief: "Document a week of using the app with a funny streak accountability angle.",
    platform: "TikTok + YouTube Shorts",
    deliverables: "1 TikTok + 1 Short",
    videoLength: "20-30 seconds each",
    trend: "day-by-day streak montage",
    idea: "Lean into comedy: the app becomes your overly committed study coach.",
    script: "Hook: 'I let an app bully me into learning Spanish for seven days.' Show days 1, 3, 7, then one phrase you can actually say.",
    basePayCents: 58000,
    viewBonus: { trigger: "every 50k verified views", amountCents: 12000, capCents: 60000 },
  },
  {
    id: "demo-notion-workspace",
    companyId: "brand-notion",
    brand: "Notion",
    niche: "tech",
    campaign: "Creator workspace reset",
    brief: "Show your messy creator workflow, then rebuild it into a simple content calendar.",
    platform: "YouTube Shorts",
    deliverables: "1 tutorial short",
    videoLength: "35-45 seconds",
    trend: "before/after productivity reset",
    idea: "The transformation is the hook: scattered notes to one clean calendar.",
    script: "Hook: 'My content system was chaos, so I rebuilt it in 30 minutes.' Show before, template sections, scheduling a real post.",
    basePayCents: 70000,
    viewBonus: { trigger: "every 30k verified views", amountCents: 10000, capCents: 50000 },
  },
  {
    id: "demo-sephora-favorites",
    companyId: "brand-sephora",
    brand: "Sephora",
    niche: "beauty",
    campaign: "Mini haul favorites",
    brief: "Pick three products from a mini haul and explain who each one is actually for.",
    platform: "TikTok + Instagram Reels",
    deliverables: "3 short reels",
    videoLength: "10-15 seconds each",
    trend: "rapid ranking + shelf pull",
    idea: "No generic haul: make each pick feel like a useful recommendation.",
    script: "Hook: 'Three minis I would actually rebuy.' Rank each product, say the skin type/use case, finish with the winner.",
    basePayCents: 75000,
    viewBonus: { trigger: "every 50k verified views", amountCents: 15000, capCents: 90000 },
  },
  {
    id: "demo-starbucks-order",
    companyId: "brand-starbucks",
    brand: "Starbucks",
    niche: "food",
    campaign: "Summer drink order",
    brief: "Create a repeatable drink-order video with the order text visible on screen.",
    platform: "TikTok",
    deliverables: "1 reel",
    videoLength: "15-20 seconds",
    trend: "order-with-me + first sip rating",
    idea: "Make it easy to copy: show exact order, taste note, and best time to drink it.",
    script: "Hook: 'My summer order when I want coffee but not a milkshake.' Show order card, pickup, first sip, 1-10 rating.",
    basePayCents: 38000,
    viewBonus: { trigger: "every 25k verified views", amountCents: 5000, capCents: 30000 },
  },
  {
    id: "demo-gymshark-set",
    companyId: "brand-gymshark",
    brand: "Gymshark",
    niche: "fitness",
    campaign: "Leg day fit test",
    brief: "Test a workout set through squats, lunges, mirror check, and one honest movement note.",
    platform: "Instagram Reels + TikTok",
    deliverables: "2 reels + 5 raw clips",
    videoLength: "20-30 seconds each",
    trend: "fit test + gym transition",
    idea: "The value is proof: show the outfit moving, not just posing.",
    script: "Hook: 'I put this set through leg day so you do not have to guess.' Show squat test, stretch test, sweat note, final rating.",
    basePayCents: 62000,
    viewBonus: { trigger: "every 40k verified views", amountCents: 10000, capCents: 60000 },
  },
];

export function getOpportunity(id: string): Opportunity | undefined {
  return OPPORTUNITIES.find((o) => o.id === id);
}

export function formatPay(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US")}`;
}
