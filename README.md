# Essity Firehose

Amazon customer review dashboard for Essity incontinence products.

A single Next.js app at the repo root. The data pipeline:

1. **[Firecrawl](https://firecrawl.dev)** scrapes the Amazon product page (title, brand, rating, star distribution, features). Stealth proxy bypasses Amazon's basic anti-bot for the `/dp/` URL.
2. **[Apify](https://apify.com)** (`junglee/amazon-reviews-scraper`) fetches individual customer reviews. Firecrawl alone can't get past Amazon's sign-in wall on `/product-reviews/`, so we delegate to a specialist.
3. **Vercel AI Gateway** (Claude Haiku 4.5) classifies each review into the dashboard schema: sentiment, themes, use-case segment, competitor mentions.
4. **Next.js** dashboard renders the JSON files from `data/` as a filterable interface with KPI deltas, trend charts, theme breakdowns, segments, and auto-generated insights.

## Layout

```
.
├── app/                          ← Next.js (app router)
├── components/                   ← dashboard UI
├── lib/
│   ├── types.ts                  ← Review, ProductMeta — single source of truth
│   ├── data.ts                   ← server-only loader for the dashboard
│   ├── scraper/
│   │   ├── amazon.ts             ← Firecrawl product page
│   │   ├── amazon-reviews-apify.ts ← Apify reviews
│   │   ├── normalize.ts          ← raw → on-disk shapes
│   │   └── cli.ts                ← `pnpm scrape`
│   └── classifier/
│       ├── prompt.ts             ← Essity-tailored prompt builder
│       └── cli.ts                ← `pnpm classify`
├── data/
│   ├── raw/amazon/<asin>.json    ← Apify-scraped reviews + metadata
│   ├── products/<asin>.json      ← ProductMeta per product (Firecrawl)
│   └── classified/<asin>.json    ← Review[] ready for the dashboard
└── public/
```

## Prerequisites

```bash
brew install pnpm node gh
```

## Setup

```bash
pnpm install
cp .env.example .env.local
# Fill in four keys:
#   FIRECRAWL_API_KEY             https://firecrawl.dev/app
#   APIFY_TOKEN                   https://console.apify.com/settings/integrations
#   APIFY_AMAZON_REVIEWS_ACTOR    e.g. "junglee/amazon-reviews-scraper" (or its hash id)
#   AI_GATEWAY_API_KEY            https://vercel.com/dashboard/ai-gateway
```

For the Apify actor, enable [junglee/amazon-reviews-scraper](https://apify.com/junglee/amazon-reviews-scraper) on your account (Try for free → Use latest version). Pricing is ~$3 per 1,000 reviews. **Free tier caps at 10 reviews per run**; upgrading to Starter lifts the cap.

## Run

```bash
# Scrape product page + reviews (default 100 reviews; free Apify tier caps at 10)
pnpm scrape -- B072JC8RQT
pnpm scrape -- B072JC8RQT --max-reviews=50      # custom cap

# Classify scraped reviews into the dashboard schema
pnpm classify -- B072JC8RQT

# Serve the dashboard
pnpm dev          # → http://localhost:3000
```

The dashboard hardcodes ASIN `B072JC8RQT` as the active product in `lib/data.ts`. Edit that constant (or pass it through a route segment) to point at a different product.

## Dev-server note (macOS)

`pnpm dev` uses webpack, not Turbopack. Turbopack's default dev server has been reported to consume 6–10+ GB of RAM on macOS ([vercel/next.js#75142](https://github.com/vercel/next.js/issues/75142), [#73921](https://github.com/vercel/next.js/issues/73921)), which can trigger `kernel_task` thermal/memory-pressure spikes. Webpack runs at ~900 MB here. If you have a newer Turbopack version that's fixed this, drop `--webpack` from `package.json`.

## Deployment

Deployed to Vercel via the GitHub integration — every push to `main` triggers a production build automatically. The Vercel project's root directory is set to `.` (the repo root). The dashboard reads JSON files from `data/` at build time, so committed data files become part of each deploy.

Env vars on Vercel are only needed if you ever run `pnpm scrape` or `pnpm classify` from Vercel Cron / Functions. For the current local-CLI workflow they only need to be in `.env.local`.
