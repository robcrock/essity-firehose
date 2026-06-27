"use client";

import { useMemo } from "react";
import type { ProductMeta, Review } from "@/lib/types";
import {
  autoInsights,
  competitiveMentions,
  computeKpis,
  filterReviews,
  negativeDrivers,
  priorPeriodReviews,
  segmentBreakdown,
  sentimentSplit,
  starDistribution,
  themeBreakdown,
  topPhrases,
  trendOverTime,
} from "@/lib/analytics";
import { FilterProvider, useFilter } from "@/lib/filter-context";
import { formatDate } from "@/lib/ui";
import { FilterBar } from "@/components/FilterBar";
import { KpiHeader } from "@/components/KpiHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TrendPanel } from "@/components/panels/TrendPanel";
import { SentimentDonut } from "@/components/panels/SentimentDonut";
import { StarDistribution } from "@/components/panels/StarDistribution";
import { ThemeBreakdown } from "@/components/panels/ThemeBreakdown";
import { SegmentsPanel } from "@/components/panels/SegmentsPanel";
import { NegativeDrivers } from "@/components/panels/NegativeDrivers";
import { CompetitivePanel } from "@/components/panels/CompetitivePanel";
import { TopPhrases } from "@/components/panels/TopPhrases";
import { AutoInsights } from "@/components/panels/AutoInsights";
import { Activity } from "lucide-react";

type DashboardProps = {
  product: ProductMeta;
  reviews: Review[];
  generatedAt: string;
};

function DashboardInner({ reviews, generatedAt }: { reviews: Review[]; generatedAt: string }) {
  const { filter } = useFilter();
  const anchor = useMemo(() => new Date(generatedAt).getTime(), [generatedAt]);

  const view = useMemo(() => {
    const current = filterReviews(reviews, filter, anchor);
    const prior = priorPeriodReviews(reviews, filter, anchor);
    const kpis = computeKpis(current, prior);
    return {
      current,
      kpis,
      trend: trendOverTime(current),
      split: sentimentSplit(current),
      stars: starDistribution(current),
      themes: themeBreakdown(current),
      segments: segmentBreakdown(current),
      negatives: negativeDrivers(current),
      competitive: competitiveMentions(current),
      phrases: topPhrases(current),
      insights: autoInsights(current, prior, kpis),
    };
  }, [reviews, filter, anchor]);

  return (
    <>
      <FilterBar />
      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6">
        {view.current.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 py-20 text-center">
            <Activity className="size-8 text-muted-foreground/50" />
            <p className="text-base font-medium text-foreground">No reviews match these filters</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try widening the time range, clearing rating filters, or resetting your selection.
            </p>
          </div>
        ) : (
          <>
            <KpiHeader kpis={view.kpis} />

            <TrendPanel data={view.trend} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SentimentDonut split={view.split} />
              <StarDistribution data={view.stars} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <ThemeBreakdown data={view.themes} />
              </div>
              <div className="lg:col-span-2">
                <AutoInsights insights={view.insights} />
              </div>
            </div>

            <SegmentsPanel data={view.segments} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <NegativeDrivers data={view.negatives} />
              <CompetitivePanel data={view.competitive} />
            </div>

            <TopPhrases data={view.phrases} />
          </>
        )}
      </main>
    </>
  );
}

export function Dashboard({ product, reviews, generatedAt }: DashboardProps) {
  return (
    <FilterProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/40">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Activity className="size-4" />
                </span>
                <span className="text-overline font-semibold uppercase tracking-wider text-primary">
                  Review Insights
                </span>
              </div>
              <h1 className="max-w-2xl text-display font-semibold leading-tight tracking-tight text-foreground text-balance">
                {product.title}
              </h1>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span>{product.brand}</span>
                <span className="text-border">·</span>
                <span>{product.category}</span>
                <span className="text-border">·</span>
                <span>{product.totalReviews.toLocaleString()} lifetime reviews</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-right text-xs leading-tight text-muted-foreground sm:block">
                Analysis as of
                <br />
                <span className="font-medium text-foreground">{formatDate(generatedAt)}</span>
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <DashboardInner reviews={reviews} generatedAt={generatedAt} />
        <footer className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Showing {reviews.length} classified reviews from Amazon ASIN {product.asin}. Sentiment, themes,
            use-case segments, and competitor mentions are AI-classified via the Vercel AI Gateway.
          </p>
        </footer>
      </div>
    </FilterProvider>
  );
}
