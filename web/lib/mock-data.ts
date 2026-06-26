import type {
  Competitor,
  ProductMeta,
  Rating,
  Review,
  Sentiment,
  Theme,
  UseCase,
} from "./types";

// The dataset is generated relative to this fixed anchor so that server and
// client renders are byte-identical (no hydration drift) and all time-range
// filtering is consistent. Treat this as "now" for the demo dataset.
export const GENERATED_AT = "2026-06-26T12:00:00.000Z";

export const PRODUCT_META: ProductMeta = {
  asin: "B07GUARD44",
  title: "DiscreetGuard Men's Bladder Leakage Protection Guards (Maximum Absorbency, 104 Count)",
  brand: "DiscreetGuard",
  category: "Health & Household → Incontinence Guards",
  avgRating: 4.4,
  totalReviews: 7843,
  starDistribution: { 5: 5490, 4: 627, 3: 392, 2: 470, 1: 864 },
};

// ----- Seeded RNG (mulberry32) -----
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260626);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function chance(p: number): boolean {
  return rng() < p;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ----- Rating distribution (~70% 5★, small middle, meaningful 1★ tail) -----
function rollRating(): Rating {
  const r = rng();
  if (r < 0.7) return 5;
  if (r < 0.78) return 4;
  if (r < 0.83) return 3;
  if (r < 0.89) return 2;
  return 1;
}

// ----- Date spread across last 12 months, mild recency bias -----
function rollDate(): string {
  const now = new Date(GENERATED_AT).getTime();
  const year = 365 * 24 * 60 * 60 * 1000;
  // bias^2 pushes mass toward recent dates while still covering 12 months
  const bias = rng();
  const ageFraction = bias * bias;
  const ts = now - ageFraction * year - rng() * 12 * 60 * 60 * 1000;
  return new Date(ts).toISOString();
}

// ----- Theme selection correlated with rating -----
const POSITIVE_THEMES: Theme[] = [
  "Discreteness",
  "Absorbency",
  "Comfort & Fit",
  "Odor control",
  "Skin sensitivity",
];
const NEGATIVE_THEMES: Theme[] = [
  "Adhesive / Stays in place",
  "Sizing",
  "Value / Price",
  "Absorbency",
  "Packaging",
];
const NEUTRAL_THEMES: Theme[] = [
  "Comfort & Fit",
  "Value / Price",
  "Absorbency",
  "Sizing",
  "Packaging",
  "Odor control",
];

function pickThemes(rating: Rating): Theme[] {
  const pool =
    rating >= 4 ? POSITIVE_THEMES : rating <= 2 ? NEGATIVE_THEMES : NEUTRAL_THEMES;
  const count = 1 + Math.floor(rng() * 3); // 1-3
  const chosen = new Set<Theme>();
  let guard = 0;
  while (chosen.size < count && guard < 20) {
    chosen.add(pick(pool));
    guard++;
  }
  return [...chosen];
}

// ----- Use case distribution -----
function rollUseCase(): UseCase {
  const r = rng();
  if (r < 0.3) return "post-surgery";
  if (r < 0.5) return "stress-incontinence";
  if (r < 0.66) return "overnight";
  if (r < 0.8) return "active";
  if (r < 0.92) return "caregiver";
  return "general";
}

// ----- Sentiment from rating with light noise -----
function rollSentiment(rating: Rating): { sentiment: Sentiment; score: number } {
  if (rating >= 4) {
    const score = clamp(0.45 + rng() * 0.55, 0.3, 1);
    return { sentiment: chance(0.04) ? "neutral" : "positive", score: chance(0.04) ? 0.1 : score };
  }
  if (rating === 3) {
    const score = clamp((rng() - 0.5) * 0.5, -0.3, 0.3);
    return { sentiment: "neutral", score };
  }
  const score = clamp(-0.45 - rng() * 0.55, -1, -0.3);
  return { sentiment: "negative", score };
}

// ----- Verbatim content pools (respectful, category-authentic) -----
const USE_CASE_OPENERS: Record<UseCase, string[]> = {
  "post-surgery": [
    "After my prostate surgery I needed something dependable while I recovered.",
    "Following my procedure my doctor suggested guards like these, and they've made recovery far easier.",
    "Bought these during my post-surgery recovery and they gave me real peace of mind.",
  ],
  "stress-incontinence": [
    "I deal with light stress leakage and wanted protection I could trust during the day.",
    "For the occasional leak when I cough or lift something, these do the job.",
    "Manageable everyday protection for stress incontinence is exactly what I was after.",
  ],
  active: [
    "I'm on my feet and active most of the day and needed something that keeps up.",
    "I still play golf and walk a lot, so I wanted protection that moves with me.",
    "As someone who stays busy, discretion and security during activity matter most.",
  ],
  overnight: [
    "I mainly needed reliable overnight coverage so I could sleep through the night.",
    "Nighttime was my biggest worry, and I wanted to wake up dry.",
    "Bought these specifically for overnight protection.",
  ],
  caregiver: [
    "I buy these for my husband and he finds them comfortable and reassuring.",
    "Caring for my father, I needed something dignified and easy for him to manage.",
    "I order these for my dad — they've made daily care so much simpler for both of us.",
  ],
  general: [
    "Just what I was looking for in everyday protection.",
    "A solid everyday option that does what it promises.",
    "These have become part of my normal routine.",
  ],
};

const THEME_POSITIVE: Partial<Record<Theme, string[]>> = {
  Discreteness: [
    "They're remarkably thin and completely invisible under regular clothes — no one would ever know.",
    "Discretion is the best part: no bulk, no noise, total confidence in public.",
    "So discreet that I've stopped worrying about anyone noticing.",
  ],
  Absorbency: [
    "The absorbency is excellent — they hold far more than I expected without feeling wet.",
    "Strong, reliable absorbency that keeps me dry for hours.",
    "Handles more than enough for my needs and locks moisture away well.",
  ],
  "Comfort & Fit": [
    "Genuinely comfortable — soft against the skin and I forget I'm wearing one.",
    "The fit is snug but never tight, and it stays comfortable all day.",
    "Comfortable enough to wear from morning to night without irritation.",
  ],
  "Odor control": [
    "Odor control is outstanding; there's simply no smell at all.",
    "I was worried about odor but these keep everything fresh and neutral.",
  ],
  "Skin sensitivity": [
    "Gentle on sensitive skin — no redness or irritation even with all-day wear.",
    "My skin reacts to a lot of products, but these have been completely fine.",
  ],
};

const THEME_NEGATIVE: Partial<Record<Theme, string[]>> = {
  "Adhesive / Stays in place": [
    "The adhesive strip just doesn't hold — it shifts out of place within an hour or two.",
    "My biggest complaint is that the adhesive gives out and the guard moves around.",
    "They won't stay put. The sticky backing peels up and bunches as I move.",
  ],
  Sizing: [
    "The sizing runs small and the coverage isn't enough for me.",
    "Wish they offered a larger size — these feel short for the protection I need.",
    "Sizing is inconsistent; some fit fine and others feel cut differently.",
  ],
  "Value / Price": [
    "For the price I expected better; you don't get many in a box.",
    "They've gotten more expensive while the count per box seems to have dropped.",
    "Decent product but the value just isn't there anymore.",
  ],
  Absorbency: [
    "These feel thinner than the previous version and don't absorb like they used to.",
    "The new design is noticeably thinner than the previous version — absorbency took a real hit.",
    "Not enough absorbency for heavier days; I had leaks I didn't used to get.",
  ],
  Packaging: [
    "The packaging arrived torn and a few were exposed.",
    "Each one is individually wrapped in noisy plastic that's hard to open discreetly.",
  ],
};

const THEME_NEUTRAL: Partial<Record<Theme, string[]>> = {
  "Comfort & Fit": [
    "Comfort is okay — fine for short stretches, less so for a full day.",
    "The fit is acceptable, nothing remarkable either way.",
  ],
  "Value / Price": [
    "Price is about average for the category.",
    "Reasonable value, though I've seen better deals elsewhere.",
  ],
  Absorbency: [
    "Absorbency is adequate for light days but I'd size up for anything heavier.",
    "Does the job for light protection, not for heavy use.",
  ],
  Sizing: ["Sizing is roughly what I expected, give or take."],
  Packaging: ["Packaging is standard — functional but nothing special."],
  "Odor control": ["Odor control is fine for the most part."],
};

const COMPETITOR_LINES: Record<Competitor, string[]> = {
  Depend: [
    "Much less bulky than the Depend guards I used before.",
    "I switched from Depend and these feel more discreet.",
    "Honestly preferred my old Depend guards for absorbency.",
  ],
  "Amazon Basics": [
    "Comparable to the Amazon Basics version but a bit more comfortable.",
    "Tried the Amazon Basics ones first; these hold up better.",
  ],
  Prevail: [
    "Prevail worked too, but these are easier to find in my size.",
    "I alternate between these and Prevail depending on the day.",
  ],
};

const POSITIVE_TITLES = [
  "Finally, real peace of mind",
  "Discreet and dependable",
  "Exactly what I needed",
  "Confidence restored",
  "Comfortable and reliable",
  "Would buy again without hesitation",
  "A quiet game-changer",
  "Highly recommend for recovery",
];
const NEUTRAL_TITLES = [
  "Does the job, with caveats",
  "Fine for light days",
  "Okay overall",
  "Decent but room to improve",
  "Mixed feelings",
];
const NEGATIVE_TITLES = [
  "Disappointed with the change",
  "Won't stay in place",
  "Not what they used to be",
  "Thinner than before",
  "Expected more for the price",
  "Back to my old brand",
];

const CLOSERS_POSITIVE = [
  "I'll be reordering.",
  "Grateful I found these.",
  "Recommending to anyone in the same situation.",
  "",
];
const CLOSERS_NEGATIVE = [
  "I won't be buying these again.",
  "Hoping they go back to the older design.",
  "Looking for an alternative now.",
  "",
];

function buildTitle(sentiment: Sentiment): string {
  if (sentiment === "positive") return pick(POSITIVE_TITLES);
  if (sentiment === "neutral") return pick(NEUTRAL_TITLES);
  return pick(NEGATIVE_TITLES);
}

function buildBody(
  sentiment: Sentiment,
  useCase: UseCase,
  themes: Theme[],
  competitors: Competitor[],
): string {
  const parts: string[] = [pick(USE_CASE_OPENERS[useCase])];
  for (const theme of themes) {
    const pool =
      sentiment === "positive"
        ? THEME_POSITIVE[theme]
        : sentiment === "negative"
          ? THEME_NEGATIVE[theme]
          : THEME_NEUTRAL[theme];
    if (pool) parts.push(pick(pool));
  }
  if (competitors.length > 0) {
    parts.push(pick(COMPETITOR_LINES[competitors[0]]));
  }
  const closer =
    sentiment === "positive"
      ? pick(CLOSERS_POSITIVE)
      : sentiment === "negative"
        ? pick(CLOSERS_NEGATIVE)
        : "";
  if (closer) parts.push(closer);
  return parts.join(" ");
}

function rollCompetitors(): Competitor[] {
  if (!chance(0.16)) return [];
  return [pick<Competitor>(["Depend", "Amazon Basics", "Prevail"])];
}

function rollHelpfulVotes(sentiment: Sentiment): number {
  // Negative + highly positive reviews tend to collect more votes
  const base = sentiment === "neutral" ? 0.4 : 1;
  const r = rng();
  if (r < 0.55) return Math.floor(rng() * 4 * base);
  if (r < 0.85) return Math.floor(4 + rng() * 16 * base);
  return Math.floor(20 + rng() * 80 * base);
}

function generateReviews(count: number): Review[] {
  const reviews: Review[] = [];
  for (let i = 0; i < count; i++) {
    const rating = rollRating();
    const { sentiment, score } = rollSentiment(rating);
    const useCase = rollUseCase();
    const themes = pickThemes(rating);
    const competitorMentions = rollCompetitors();
    const review: Review = {
      id: `r-${(i + 1).toString().padStart(4, "0")}`,
      date: rollDate(),
      rating,
      title: buildTitle(sentiment),
      body: buildBody(sentiment, useCase, themes, competitorMentions),
      verifiedPurchase: chance(0.85),
      helpfulVotes: rollHelpfulVotes(sentiment),
      sentiment,
      sentimentScore: Number(score.toFixed(2)),
      themes,
      useCase,
      competitorMentions,
    };
    reviews.push(review);
  }
  // newest first
  return reviews.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export const REVIEWS: Review[] = generateReviews(250);
