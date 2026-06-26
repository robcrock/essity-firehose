export type Sentiment = "positive" | "neutral" | "negative";

export type Theme =
  | "Absorbency"
  | "Comfort & Fit"
  | "Discreteness"
  | "Adhesive / Stays in place"
  | "Odor control"
  | "Value / Price"
  | "Sizing"
  | "Skin sensitivity"
  | "Packaging";

export const THEMES: Theme[] = [
  "Absorbency",
  "Comfort & Fit",
  "Discreteness",
  "Adhesive / Stays in place",
  "Odor control",
  "Value / Price",
  "Sizing",
  "Skin sensitivity",
  "Packaging",
];

export type UseCase =
  | "post-surgery"
  | "stress-incontinence"
  | "active"
  | "overnight"
  | "caregiver"
  | "general";

export const USE_CASES: UseCase[] = [
  "post-surgery",
  "stress-incontinence",
  "active",
  "overnight",
  "caregiver",
  "general",
];

export const USE_CASE_LABELS: Record<UseCase, string> = {
  "post-surgery": "Post-surgery recovery",
  "stress-incontinence": "Stress incontinence",
  active: "Active / daytime",
  overnight: "Overnight protection",
  caregiver: "Caregiver purchase",
  general: "General use",
};

export type Competitor = "Depend" | "Amazon Basics" | "Prevail";

export const COMPETITORS: Competitor[] = ["Depend", "Amazon Basics", "Prevail"];

export type Rating = 1 | 2 | 3 | 4 | 5;

export type Review = {
  id: string;
  date: string; // ISO date
  rating: Rating;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  helpfulVotes: number;
  sentiment: Sentiment;
  sentimentScore: number; // -1.0 to 1.0
  themes: Theme[];
  useCase: UseCase;
  competitorMentions: Competitor[];
};

export type ProductMeta = {
  asin: string;
  title: string;
  brand: string;
  category: string;
  avgRating: number;
  totalReviews: number;
  starDistribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
};

// ----- Filter state -----

export type TimeRange = "7D" | "30D" | "90D" | "1Y" | "All";

export const TIME_RANGES: TimeRange[] = ["7D", "30D", "90D", "1Y", "All"];

export const TIME_RANGE_DAYS: Record<TimeRange, number | null> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
  "1Y": 365,
  All: null,
};

export type FilterState = {
  timeRange: TimeRange;
  ratings: Rating[]; // [] = all
  verifiedOnly: boolean;
  themes: Theme[]; // [] = all
  keyword: string;
  // Cross-filters set by clicking panels
  segment: UseCase | null;
};

export const DEFAULT_FILTER_STATE: FilterState = {
  timeRange: "30D",
  ratings: [],
  verifiedOnly: false,
  themes: [],
  keyword: "",
  segment: null,
};
