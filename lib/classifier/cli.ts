import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import fs from "node:fs/promises";
import path from "node:path";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { Rating, Review } from "@/lib/types";
import type { NormalizedReview, ProductFile, RawReviewsFile } from "@/lib/scraper/normalize";
import { buildPrompt } from "./prompt";

const MODEL = "anthropic/claude-haiku-4-5-20251001";

const ClassificationSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  sentimentScore: z.number().min(-1).max(1),
  themes: z.array(
    z.enum([
      "Absorbency",
      "Comfort & Fit",
      "Discreteness",
      "Adhesive / Stays in place",
      "Odor control",
      "Value / Price",
      "Sizing",
      "Skin sensitivity",
      "Packaging",
    ]),
  ),
  useCase: z.enum([
    "post-surgery",
    "stress-incontinence",
    "active",
    "overnight",
    "caregiver",
    "general",
  ]),
  competitorMentions: z.array(z.enum(["Depend", "Amazon Basics", "Prevail"])),
});

type Classification = z.infer<typeof ClassificationSchema>;

function fallbackClassification(rating: number): Classification {
  const sentiment: Classification["sentiment"] =
    rating >= 4 ? "positive" : rating <= 2 ? "negative" : "neutral";
  return {
    sentiment,
    sentimentScore: rating >= 4 ? 0.5 : rating <= 2 ? -0.5 : 0,
    themes: [],
    useCase: "general",
    competitorMentions: [],
  };
}

async function classifyOne(
  review: NormalizedReview,
  product: ProductFile,
): Promise<Classification> {
  try {
    const result = await generateText({
      model: MODEL,
      prompt: buildPrompt(review, product),
      output: Output.object({ schema: ClassificationSchema }),
    });
    return result.output as Classification;
  } catch (err) {
    console.error(`  classify failed for ${review.reviewId}: ${(err as Error).message}`);
    return fallbackClassification(review.rating);
  }
}

function asReview(
  raw: NormalizedReview,
  asin: string,
  classification: Classification,
): Review {
  return {
    id: `amazon:${asin}:${raw.reviewId}`,
    date: raw.date,
    rating: raw.rating as Rating,
    title: raw.title ?? "",
    body: raw.body,
    verifiedPurchase: raw.verifiedPurchase,
    helpfulVotes: raw.helpfulVotes,
    sentiment: classification.sentiment,
    sentimentScore: classification.sentimentScore,
    themes: classification.themes,
    useCase: classification.useCase,
    competitorMentions: classification.competitorMentions,
  };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function classifyBatch(
  reviews: NormalizedReview[],
  product: ProductFile,
  asin: string,
  batchSize = 5,
  delayMs = 300,
): Promise<Review[]> {
  const out: Review[] = [];
  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(reviews.length / batchSize);
    console.log(`  batch ${batchNum}/${totalBatches} (reviews ${i + 1}-${Math.min(i + batchSize, reviews.length)})`);

    const classified = await Promise.all(
      batch.map(async (raw) => asReview(raw, asin, await classifyOne(raw, product))),
    );
    out.push(...classified);

    if (i + batchSize < reviews.length) await sleep(delayMs);
  }
  return out;
}

type ParsedArgs = { asins: string[] };

function parseArgs(argv: string[]): ParsedArgs {
  const asins = argv.filter((a) => !a.startsWith("--"));
  if (asins.length === 0) asins.push("B072JC8RQT");
  return { asins };
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  const { asins } = parseArgs(process.argv.slice(2));
  const classifiedDir = path.join(process.cwd(), "data", "classified");
  await ensureDir(classifiedDir);

  for (const asin of asins) {
    console.log(`\nClassifying ${asin}...`);

    const rawPath = path.join(process.cwd(), "data", "raw", "amazon", `${asin}.json`);
    const productPath = path.join(process.cwd(), "data", "products", `${asin}.json`);
    const raw = JSON.parse(await fs.readFile(rawPath, "utf8")) as RawReviewsFile;
    const product = JSON.parse(await fs.readFile(productPath, "utf8")) as ProductFile;

    console.log(`  ${raw.reviews.length} reviews to classify against "${product.title}"`);

    const classified = await classifyBatch(raw.reviews, product, asin);
    const outPath = path.join(classifiedDir, `${asin}.json`);
    await fs.writeFile(outPath, JSON.stringify(classified, null, 2));

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    for (const r of classified) sentimentCounts[r.sentiment]++;

    console.log(`  → ${path.relative(process.cwd(), outPath)}`);
    console.log(`  sentiment: +${sentimentCounts.positive} / ~${sentimentCounts.neutral} / -${sentimentCounts.negative}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
