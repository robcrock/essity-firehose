import type { NormalizedReview } from "@/lib/scraper/normalize";
import type { ProductFile } from "@/lib/scraper/normalize";

export function buildPrompt(review: NormalizedReview, product: ProductFile): string {
  const reviewText = [review.title, review.body].filter(Boolean).join(" — ");
  const verifiedTag = review.verifiedPurchase ? ", verified purchase" : "";

  return `You are analyzing a customer review of an Essity incontinence product sold on Amazon.

Product: "${product.title}" (brand: ${product.brand})
Category: ${product.category}

Review (rating ${review.rating}/5${verifiedTag}):
"${reviewText}"

Classify this review along these dimensions:

- sentiment: overall tone — "positive", "neutral", or "negative".
- sentimentScore: a number from -1.0 (extremely negative) to 1.0 (extremely positive).
- themes: the product attributes the reviewer ACTUALLY discusses, from this list — Absorbency, Comfort & Fit, Discreteness, Adhesive / Stays in place, Odor control, Value / Price, Sizing, Skin sensitivity, Packaging. Only include themes explicitly addressed; do not infer.
- useCase: the life context the reviewer describes — "post-surgery" (recovery from surgery/childbirth), "stress-incontinence" (leaks from coughing/laughing/exercise), "active" (daytime / on-the-go), "overnight" (sleep / bedtime protection), "caregiver" (purchased for someone else, e.g. parent), or "general" (no specific context).
- competitorMentions: which competing brand names the reviewer mentions by name, from — Depend, Amazon Basics, Prevail. Empty array if none.

Be precise. If a review says "they hold a lot" → Absorbency. If it says "didn't leak at night" → Absorbency + overnight useCase. Do not pad themes; an irrelevant theme is worse than a missing one.`;
}
