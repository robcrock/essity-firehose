import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { ProductMeta, Review } from "./types";

export const ACTIVE_ASIN = "B072JC8RQT";

export type DashboardData = {
  product: ProductMeta;
  reviews: Review[];
  generatedAt: string;
};

export async function getDashboardData(
  asin: string = ACTIVE_ASIN,
): Promise<DashboardData | null> {
  const productPath = path.join(process.cwd(), "data", "products", `${asin}.json`);
  const classifiedPath = path.join(process.cwd(), "data", "classified", `${asin}.json`);

  let productRaw: string;
  let reviewsRaw: string;
  try {
    [productRaw, reviewsRaw] = await Promise.all([
      fs.readFile(productPath, "utf8"),
      fs.readFile(classifiedPath, "utf8"),
    ]);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }

  const productFile = JSON.parse(productRaw);
  const reviews = JSON.parse(reviewsRaw) as Review[];

  const product: ProductMeta = {
    asin: productFile.asin,
    title: productFile.title,
    brand: productFile.brand,
    category: productFile.category,
    avgRating: productFile.avgRating,
    totalReviews: productFile.totalReviews,
    starDistribution: productFile.starDistribution,
  };

  return {
    product,
    reviews,
    generatedAt: productFile.scrapedAt,
  };
}
