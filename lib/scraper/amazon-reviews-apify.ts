import { ApifyClient } from "apify-client";

export type ApifyReview = {
  reviewId: string;
  rating: number;
  title: string | null;
  body: string;
  author: string | null;
  date: string;
  verifiedPurchase: boolean;
  helpfulVotes: number;
};

type FetchOptions = {
  maxReviews?: number;
};

export async function fetchReviewsViaApify(
  asin: string,
  opts: FetchOptions = {},
): Promise<ApifyReview[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("APIFY_TOKEN is not set. Add it to .env.local.");
  }
  const actorId = process.env.APIFY_AMAZON_REVIEWS_ACTOR;
  if (!actorId) {
    throw new Error(
      "APIFY_AMAZON_REVIEWS_ACTOR is not set. Pick an Amazon-reviews actor at apify.com/store and put its id (e.g. 'username/actor-name') in .env.local.",
    );
  }

  const maxReviews = opts.maxReviews ?? 100;
  const productUrl = `https://www.amazon.com/dp/${asin}`;

  const input = {
    productUrls: [{ url: productUrl }],
    asins: [asin],
    maxReviews,
    maxItems: maxReviews,
    country: "US",
    sortBy: "recent",
    includeReviews: true,
  };

  console.log(`  calling Apify actor ${actorId} (asin=${asin}, max=${maxReviews})...`);
  const client = new ApifyClient({ token });
  const run = await client.actor(actorId).call(input);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  console.log(`  Apify returned ${items.length} dataset items`);

  const normalized = items
    .map((item) => normalize(item))
    .filter((r): r is ApifyReview => r !== null);

  if (normalized.length === 0 && items.length > 0) {
    console.warn(
      `  WARNING: actor returned ${items.length} items but none had recognizable review fields. ` +
        `First item keys: ${Object.keys(items[0] as object).slice(0, 15).join(", ")}`,
    );
  }

  return normalized;
}

function normalize(item: unknown): ApifyReview | null {
  if (!item || typeof item !== "object") return null;
  const obj = item as Record<string, unknown>;

  const rating = pickNumber(obj, ["rating", "stars", "score", "ratingScore", "reviewRating"]);
  const body = pickString(obj, ["text", "body", "reviewText", "reviewBody", "content", "review", "reviewDescription"]);
  if (rating == null || !body) return null;

  return {
    reviewId:
      pickString(obj, ["id", "reviewId", "_id", "reviewID"]) ??
      `apify:${(obj.author as string) ?? "anon"}:${(obj.date as string) ?? ""}`,
    rating: Math.round(Math.max(1, Math.min(5, rating))),
    title: pickString(obj, ["title", "reviewTitle", "headline", "name"]),
    body,
    author: pickString(obj, ["author", "reviewerName", "customerName", "user", "userName", "reviewer"]),
    date: pickDateIso(obj, ["date", "reviewDate", "publishedAt", "reviewedAt", "createdAt", "timestamp"]),
    verifiedPurchase: pickBool(obj, ["verifiedPurchase", "isVerified", "verified", "isVerifiedPurchase"]) ?? false,
    helpfulVotes: pickNumber(obj, ["helpful", "helpfulVotes", "helpfulCount", "votedHelpful", "totalHelpful"]) ?? 0,
  };
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function pickBool(obj: Record<string, unknown>, keys: string[]): boolean | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "boolean") return v;
  }
  return null;
}

function pickDateIso(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" || typeof v === "number") {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }
  return new Date().toISOString();
}
