import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import fs from "node:fs/promises";
import path from "node:path";
import { scrapeAmazonProduct } from "./amazon";
import { fetchReviewsViaApify } from "./amazon-reviews-apify";
import { toProductFile, toRawReviewsFile } from "./normalize";

const DEFAULT_ASIN = "B072JC8RQT";

type ParsedArgs = {
  inputs: string[];
  maxReviews: number;
};

function parseArgs(argv: string[]): ParsedArgs {
  const inputs: string[] = [];
  let maxReviews = 100;
  for (const arg of argv) {
    if (arg.startsWith("--max-reviews=")) {
      const n = Number(arg.slice("--max-reviews=".length));
      if (Number.isFinite(n) && n > 0) maxReviews = n;
    } else if (!arg.startsWith("--")) {
      inputs.push(arg);
    }
  }
  if (inputs.length === 0) inputs.push(DEFAULT_ASIN);
  return { inputs, maxReviews };
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  const { inputs, maxReviews } = parseArgs(process.argv.slice(2));
  const productsDir = path.join(process.cwd(), "data", "products");
  const rawDir = path.join(process.cwd(), "data", "raw", "amazon");
  await ensureDir(productsDir);
  await ensureDir(rawDir);

  for (const input of inputs) {
    console.log(`\nScraping ${input}...`);
    const productScrape = await scrapeAmazonProduct(input);
    const productFile = toProductFile(productScrape);

    const apifyReviews = await fetchReviewsViaApify(productScrape.asin, { maxReviews });
    const rawFile = toRawReviewsFile(
      productScrape.asin,
      productScrape.url,
      productScrape.scrapedAt,
      apifyReviews,
    );

    const productPath = path.join(productsDir, `${productScrape.asin}.json`);
    const rawPath = path.join(rawDir, `${productScrape.asin}.json`);
    await fs.writeFile(productPath, JSON.stringify(productFile, null, 2));
    await fs.writeFile(rawPath, JSON.stringify(rawFile, null, 2));

    console.log(`  ${productScrape.asin}: "${productFile.title}"`);
    console.log(`  ${productScrape.asin}: ${productFile.avgRating}★ from ${productFile.totalReviews} ratings`);
    console.log(`  ${productScrape.asin}: ${rawFile.reviews.length} reviews collected from Apify`);
    console.log(`  → ${path.relative(process.cwd(), productPath)}`);
    console.log(`  → ${path.relative(process.cwd(), rawPath)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
