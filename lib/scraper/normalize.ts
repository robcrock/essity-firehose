import type { ProductMeta } from "@/lib/types";
import type { AmazonProductScrape, ProductScrape } from "./amazon";
import type { ApifyReview } from "./amazon-reviews-apify";

export type NormalizedReview = {
  reviewId: string;
  rating: number;
  title: string | null;
  body: string;
  author: string | null;
  date: string;
  verifiedPurchase: boolean;
  helpfulVotes: number;
};

export type RawReviewsFile = {
  asin: string;
  productUrl: string;
  scrapedAt: string;
  reviews: NormalizedReview[];
};

export type ProductFile = ProductMeta & {
  url: string;
  scrapedAt: string;
  price: string | null;
  features: string[];
  markdown: string;
};

function normalizeStarDistribution(
  raw: ProductScrape["starDistribution"],
): ProductMeta["starDistribution"] {
  return {
    5: raw["5"] ?? 0,
    4: raw["4"] ?? 0,
    3: raw["3"] ?? 0,
    2: raw["2"] ?? 0,
    1: raw["1"] ?? 0,
  };
}

export function toProductFile(scrape: AmazonProductScrape): ProductFile {
  const p = scrape.product;
  return {
    asin: scrape.asin,
    title: p.title,
    brand: p.brand,
    category: p.category,
    avgRating: p.avgRating,
    totalReviews: p.totalReviews,
    starDistribution: normalizeStarDistribution(p.starDistribution),
    url: scrape.url,
    scrapedAt: scrape.scrapedAt,
    price: p.price,
    features: p.features,
    markdown: scrape.productMarkdown,
  };
}

export function toRawReviewsFile(
  asin: string,
  productUrl: string,
  scrapedAt: string,
  apifyReviews: ApifyReview[],
): RawReviewsFile {
  const reviews: NormalizedReview[] = apifyReviews.map((r) => ({
    reviewId: r.reviewId,
    rating: r.rating,
    title: r.title,
    body: r.body,
    author: r.author,
    date: r.date,
    verifiedPurchase: r.verifiedPurchase,
    helpfulVotes: r.helpfulVotes,
  }));
  return { asin, productUrl, scrapedAt, reviews };
}
