import {
  type Competitor,
  COMPETITORS,
  type FilterState,
  type Review,
  type Sentiment,
  type Theme,
  THEMES,
  type UseCase,
  USE_CASES,
  USE_CASE_LABELS,
  TIME_RANGE_DAYS,
} from "./types";
import { GENERATED_AT } from "./mock-data";

const DAY = 24 * 60 * 60 * 1000;
const ANCHOR = new Date(GENERATED_AT).getTime();

// ----- Filtering -----

function matchesNonTimeFilters(r: Review, f: FilterState): boolean {
  if (f.ratings.length > 0 && !f.ratings.includes(r.rating)) return false;
  if (f.verifiedOnly && !r.verifiedPurchase) return false;
  if (f.themes.length > 0 && !r.themes.some((t) => f.themes.includes(t))) return false;
  if (f.segment && r.useCase !== f.segment) return false;
  if (f.keyword.trim()) {
    const k = f.keyword.trim().toLowerCase();
    if (!r.title.toLowerCase().includes(k) && !r.body.toLowerCase().includes(k)) {
      return false;
    }
  }
  return true;
}

export function getWindow(f: FilterState): { start: number; end: number } {
  const days = TIME_RANGE_DAYS[f.timeRange];
  const end = ANCHOR;
  const start = days === null ? 0 : end - days * DAY;
  return { start, end };
}

export function filterReviews(reviews: Review[], f: FilterState): Review[] {
  const { start, end } = getWindow(f);
  return reviews.filter((r) => {
    const t = +new Date(r.date);
    if (t < start || t > end) return false;
    return matchesNonTimeFilters(r, f);
  });
}

// Prior equivalent period (same length immediately before the current window).
export function priorPeriodReviews(reviews: Review[], f: FilterState): Review[] | null {
  const days = TIME_RANGE_DAYS[f.timeRange];
  if (days === null) return null; // "All" has no prior period
  const currentStart = ANCHOR - days * DAY;
  const priorStart = currentStart - days * DAY;
  return reviews.filter((r) => {
    const t = +new Date(r.date);
    if (t < priorStart || t >= currentStart) return false;
    return matchesNonTimeFilters(r, f);
  });
}

// ----- Aggregations -----

export function avgRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

export function netSentiment(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const pos = reviews.filter((r) => r.sentiment === "positive").length;
  const neg = reviews.filter((r) => r.sentiment === "negative").length;
  return ((pos - neg) / reviews.length) * 100;
}

export function verifiedShare(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  return (reviews.filter((r) => r.verifiedPurchase).length / reviews.length) * 100;
}

export function sentimentSplit(reviews: Review[]): Record<Sentiment, number> {
  return {
    positive: reviews.filter((r) => r.sentiment === "positive").length,
    neutral: reviews.filter((r) => r.sentiment === "neutral").length,
    negative: reviews.filter((r) => r.sentiment === "negative").length,
  };
}

export function starDistribution(reviews: Review[]): { star: number; count: number }[] {
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
}

export type KpiDelta = number | null;

export type Kpis = {
  avgRating: number;
  avgRatingDelta: KpiDelta;
  count: number;
  countDelta: KpiDelta;
  netSentiment: number;
  netSentimentDelta: KpiDelta;
  verifiedShare: number;
  topTheme: { theme: Theme; count: number } | null;
};

export function computeKpis(current: Review[], prior: Review[] | null): Kpis {
  const themeCounts = themeBreakdown(current);
  const topTheme =
    themeCounts.length > 0 ? { theme: themeCounts[0].theme, count: themeCounts[0].count } : null;

  const curAvg = avgRating(current);
  const curNet = netSentiment(current);

  return {
    avgRating: curAvg,
    avgRatingDelta: prior && prior.length > 0 ? curAvg - avgRating(prior) : null,
    count: current.length,
    countDelta: prior ? current.length - prior.length : null,
    netSentiment: curNet,
    netSentimentDelta: prior && prior.length > 0 ? curNet - netSentiment(prior) : null,
    verifiedShare: verifiedShare(current),
    topTheme,
  };
}

// ----- Time-series trend -----

function weekStartOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d;
}

export type TrendPoint = {
  weekStart: string;
  label: string;
  avgRating: number;
  netSentiment: number;
  count: number;
};

export function trendOverTime(reviews: Review[]): TrendPoint[] {
  const buckets = new Map<string, Review[]>();
  for (const r of reviews) {
    const ws = weekStartOf(new Date(r.date)).toISOString().slice(0, 10);
    if (!buckets.has(ws)) buckets.set(ws, []);
    buckets.get(ws)!.push(r);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([weekStart, group]) => {
      const d = new Date(weekStart);
      return {
        weekStart,
        label: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
        avgRating: Number(avgRating(group).toFixed(2)),
        netSentiment: Number(netSentiment(group).toFixed(1)),
        count: group.length,
      };
    });
}

// ----- Theme breakdown (centerpiece) -----

export type ThemeStat = {
  theme: Theme;
  count: number;
  avgSentiment: number; // -1..1
  positiveShare: number; // 0..100
  trend: number[]; // mention count per bucket across the window
};

function avgSentimentScore(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((s, r) => s + r.sentimentScore, 0) / reviews.length;
}

function bucketCounts(reviews: Review[], bucketCount: number): number[] {
  if (reviews.length === 0) return new Array(bucketCount).fill(0);
  const times = reviews.map((r) => +new Date(r.date));
  const min = Math.min(...times);
  const max = Math.max(...times);
  const span = Math.max(max - min, 1);
  const buckets = new Array(bucketCount).fill(0);
  for (const t of times) {
    const idx = Math.min(bucketCount - 1, Math.floor(((t - min) / span) * bucketCount));
    buckets[idx]++;
  }
  return buckets;
}

export function themeBreakdown(reviews: Review[]): ThemeStat[] {
  const stats = THEMES.map((theme) => {
    const matching = reviews.filter((r) => r.themes.includes(theme));
    const pos = matching.filter((r) => r.sentiment === "positive").length;
    return {
      theme,
      count: matching.length,
      avgSentiment: Number(avgSentimentScore(matching).toFixed(2)),
      positiveShare: matching.length ? Number(((pos / matching.length) * 100).toFixed(0)) : 0,
      trend: bucketCounts(matching, 8),
    };
  }).filter((s) => s.count > 0);
  return stats.sort((a, b) => b.count - a.count);
}

// ----- Customer segments -----

export type SegmentStat = {
  useCase: UseCase;
  label: string;
  count: number;
  avgSentiment: number;
  netSentiment: number;
};

export function segmentBreakdown(reviews: Review[]): SegmentStat[] {
  return USE_CASES.map((useCase) => {
    const matching = reviews.filter((r) => r.useCase === useCase);
    return {
      useCase,
      label: USE_CASE_LABELS[useCase],
      count: matching.length,
      avgSentiment: Number(avgSentimentScore(matching).toFixed(2)),
      netSentiment: Number(netSentiment(matching).toFixed(0)),
    };
  })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}

// ----- Negative drivers -----

export type NegativeDriver = {
  theme: Theme;
  count: number;
  avgSentiment: number;
  quote: { body: string; rating: number; date: string };
};

export function negativeDrivers(reviews: Review[]): NegativeDriver[] {
  const negatives = reviews.filter((r) => r.sentiment === "negative");
  const byTheme = new Map<Theme, Review[]>();
  for (const r of negatives) {
    for (const t of r.themes) {
      if (!byTheme.has(t)) byTheme.set(t, []);
      byTheme.get(t)!.push(r);
    }
  }
  return [...byTheme.entries()]
    .map(([theme, group]) => {
      const rep = [...group].sort((a, b) => b.helpfulVotes - a.helpfulVotes)[0];
      return {
        theme,
        count: group.length,
        avgSentiment: Number(avgSentimentScore(group).toFixed(2)),
        quote: { body: rep.body, rating: rep.rating, date: rep.date },
      };
    })
    .sort((a, b) => b.count - a.count);
}

// ----- Competitive mentions -----

export type CompetitiveStat = {
  competitor: Competitor;
  count: number;
  share: number;
  positive: number;
  neutral: number;
  negative: number;
  avgSentiment: number;
};

export function competitiveMentions(reviews: Review[]): CompetitiveStat[] {
  const mentionsByComp = COMPETITORS.map((competitor) => {
    const matching = reviews.filter((r) => r.competitorMentions.includes(competitor));
    return { competitor, matching };
  });
  const total = mentionsByComp.reduce((s, m) => s + m.matching.length, 0);
  return mentionsByComp
    .map(({ competitor, matching }) => ({
      competitor,
      count: matching.length,
      share: total ? Number(((matching.length / total) * 100).toFixed(0)) : 0,
      positive: matching.filter((r) => r.sentiment === "positive").length,
      neutral: matching.filter((r) => r.sentiment === "neutral").length,
      negative: matching.filter((r) => r.sentiment === "negative").length,
      avgSentiment: Number(avgSentimentScore(matching).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count);
}

// ----- Top phrases -----

const POSITIVE_PHRASES = [
  "discreet",
  "comfortable",
  "peace of mind",
  "absorbency",
  "stays dry",
  "no smell",
  "odor control",
  "invisible",
  "reliable",
  "soft",
  "confidence",
  "recommend",
];
const NEGATIVE_PHRASES = [
  "adhesive",
  "shifts",
  "thinner than the previous version",
  "thinner",
  "too small",
  "leaked",
  "expensive",
  "won't stay",
  "moves around",
  "torn",
  "bunches",
  "not enough",
];

export type PhraseChip = { phrase: string; count: number };

function countPhrases(reviews: Review[], phrases: string[]): PhraseChip[] {
  return phrases
    .map((phrase) => {
      const p = phrase.toLowerCase();
      const count = reviews.filter((r) => r.body.toLowerCase().includes(p)).length;
      return { phrase, count };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function topPhrases(reviews: Review[]): {
  positive: PhraseChip[];
  negative: PhraseChip[];
} {
  return {
    positive: countPhrases(
      reviews.filter((r) => r.sentiment !== "negative"),
      POSITIVE_PHRASES,
    ),
    negative: countPhrases(
      reviews.filter((r) => r.sentiment !== "positive"),
      NEGATIVE_PHRASES,
    ),
  };
}

// ----- Auto insights -----

export type Insight = {
  tone: "positive" | "negative" | "neutral";
  headline: string;
  detail: string;
};

export function autoInsights(
  current: Review[],
  prior: Review[] | null,
  kpis: Kpis,
): Insight[] {
  const insights: Insight[] = [];
  if (current.length === 0) return insights;

  const themes = themeBreakdown(current);
  const positives = current.filter((r) => r.sentiment === "positive");

  const posThemes = [...themes].sort((a, b) => b.positiveShare - a.positiveShare);
  const topPos = posThemes.find((t) => t.count >= 3);
  if (topPos && positives.length > 0) {
    const inPos = positives.filter((r) => r.themes.includes(topPos.theme)).length;
    const pct = Math.round((inPos / positives.length) * 100);
    insights.push({
      tone: "positive",
      headline: `${topPos.theme} is the strongest positive driver`,
      detail: `It appears in ${pct}% of positive reviews this period — the clearest reason customers stay loyal.`,
    });
  }

  if (prior && prior.length > 0) {
    const curNeg = negativeDrivers(current);
    const priorNeg = negativeDrivers(prior);
    let biggestRise: { theme: Theme; delta: number } | null = null;
    for (const c of curNeg) {
      const p = priorNeg.find((x) => x.theme === c.theme);
      const curRate = c.count / current.length;
      const priorRate = p ? p.count / prior.length : 0;
      const delta = (curRate - priorRate) * 100;
      if (!biggestRise || delta > biggestRise.delta) {
        biggestRise = { theme: c.theme, delta };
      }
    }
    if (biggestRise && biggestRise.delta >= 2) {
      insights.push({
        tone: "negative",
        headline: `${biggestRise.theme} complaints are rising`,
        detail: `Mentions in negative reviews rose ${biggestRise.delta.toFixed(0)} points versus the prior period — worth a closer look.`,
      });
    }
  }

  if (kpis.netSentimentDelta !== null && Math.abs(kpis.netSentimentDelta) >= 1) {
    const up = kpis.netSentimentDelta > 0;
    insights.push({
      tone: up ? "positive" : "negative",
      headline: `Net sentiment ${up ? "improved" : "softened"} ${Math.abs(kpis.netSentimentDelta).toFixed(0)} pts`,
      detail: `Now ${kpis.netSentiment.toFixed(0)}% net positive versus the prior equivalent period.`,
    });
  }

  insights.push({
    tone: "neutral",
    headline: `${kpis.verifiedShare.toFixed(0)}% of reviews are verified purchases`,
    detail:
      kpis.verifiedShare >= 80
        ? "Feedback in this period is highly trustworthy — sourced from confirmed buyers."
        : "A notable share of reviews are unverified; weight verified feedback more heavily.",
  });

  return insights.slice(0, 4);
}
