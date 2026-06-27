import { Firecrawl } from "firecrawl";
import { z } from "zod";

const ProductExtraction = z.object({
  title: z.string().describe("The product title at the top of the page"),
  brand: z.string().describe("The brand or manufacturer name. Use the value next to 'Brand' if shown, otherwise infer from the title."),
  category: z.string().describe("Product category breadcrumb path joined with ' > ', e.g. 'Health, Household & Baby Care > Personal Care > Incontinence'"),
  price: z.string().nullable().describe("Current price as displayed, including currency symbol, e.g. '$24.99'. null if not shown."),
  avgRating: z.number().describe("Average star rating as a number 1-5, e.g. 4.6"),
  totalReviews: z.number().describe("Total number of customer ratings as a plain integer (strip commas)"),
  starDistribution: z
    .object({
      "5": z.number(),
      "4": z.number(),
      "3": z.number(),
      "2": z.number(),
      "1": z.number(),
    })
    .describe("Percentage breakdown of star ratings shown in the ratings histogram. Each value is 0-100 (a percentage)."),
  features: z.array(z.string()).describe("Bullet points from the 'About this item' section, each as a separate string"),
});

export type ProductScrape = z.infer<typeof ProductExtraction>;

export type AmazonProductScrape = {
  asin: string;
  url: string;
  scrapedAt: string;
  product: ProductScrape;
  productMarkdown: string;
};

export function parseAsin(input: string): string {
  const trimmed = input.trim();
  if (/^[A-Z0-9]{10}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/\/(?:dp|gp\/product|product-reviews)\/([A-Z0-9]{10})/);
  if (m) return m[1];
  throw new Error(`Could not extract ASIN from input: ${input}`);
}

export type ScrapeProductOptions = {
  maxAgeMs?: number;
};

export async function scrapeAmazonProduct(
  input: string,
  options: ScrapeProductOptions = {},
): Promise<AmazonProductScrape> {
  const maxAge = options.maxAgeMs ?? 3_600_000;

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not set. Add it to .env.local.");
  }

  const client = new Firecrawl({ apiKey });
  const asin = parseAsin(input);
  const productUrl = `https://www.amazon.com/dp/${asin}`;

  const productDoc = await client.scrape(productUrl, {
    formats: [
      "markdown",
      { type: "json", schema: ProductExtraction },
    ],
    onlyMainContent: true,
    proxy: "stealth",
    maxAge,
  });

  const product = productDoc.json as ProductScrape | undefined;
  if (!product) {
    throw new Error(`Firecrawl returned no JSON extraction for product ${asin}`);
  }

  return {
    asin,
    url: productUrl,
    scrapedAt: new Date().toISOString(),
    product,
    productMarkdown: productDoc.markdown ?? "",
  };
}
