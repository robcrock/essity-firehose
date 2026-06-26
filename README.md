# Essity Firehose

Review insights dashboard for App Store and Google Play feedback on Abbott's FreeStyle Libre app family.

This repo was split from [`robcrock/firehose`](https://github.com/robcrock/firehose) at commit `e3b3a81` (merged PR #5). The original `firehose` repo continues as the Phase 1 demo; this repo holds the review analytics dashboard work.

## What's in the dashboard

- KPI strip with period-over-period deltas
- Sentiment, star rating, and theme breakdowns
- Trend charts, competitive mentions, negative drivers, and auto-generated insights
- Global filters for date range, product, platform, rating, and sentiment

## Layout

```
essity-firehose/
├── data/reviews.json      ← written by scraper, read by web
├── scraper/               ← Python scraper (uv)
└── web/                   ← Next.js 16 dashboard (pnpm)
```

## Prerequisites

```bash
brew install uv pnpm node gh
```

## Run it

```bash
# 1. Pull ~90 days of reviews across all 7 app/OS combos
cd scraper
uv run python -m firehose_scraper.main

# 2. Start the dashboard
cd ../web
pnpm install
pnpm dev
# → http://localhost:3000
```

## Known limits

- **iOS 500-review ceiling.** Apple's public reviews RSS caps at 500 records per app, so for the highest-volume app (*Libre by Abbott*) we cover ~65 of the requested 90 days. All other apps fit comfortably in the window.
- **No deduplication across app versions.** A review is keyed by `mobile:{os}:{storeId}:{reviewId}` — if Apple re-issues an ID after an update, it'd be treated as a new review. Hasn't been observed.

## Dev-server note (macOS)

`pnpm dev` uses webpack, not Turbopack. Turbopack's default dev server has been reported to consume 6–10+ GB of RAM on macOS (vercel/next.js#75142, #73921), which can trigger `kernel_task` thermal/memory-pressure spikes. Webpack runs at ~900 MB here. If you have a newer Turbopack version that's fixed this, drop `--webpack` from `package.json`.

## Deployment

If you previously deployed from `robcrock/firehose`, repoint the hosting project (e.g. Vercel) to `robcrock/essity-firehose` instead.
