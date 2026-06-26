# Firehose

A local dashboard of App Store + Google Play reviews for Abbott's FreeStyle Libre app family — Phase 1 demo.

The v1 scope is deliberately minimal: a single line chart of daily review counts across 7 app/OS combos, with a scrubbable date-range brush that filters a table of raw reviews below. No sentiment scoring, no classification — just counts + scrubbing.

## Layout

```
firehose/
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

## Phase 2 ideas (not built)

- Sentiment + category classification via Claude API
- App-by-app and OS-by-OS comparison charts
- Volume-spike detector for release-day / recall anomalies
- Word-cloud of 1-star review phrases
