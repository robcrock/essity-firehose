"use client";

import { useState } from "react";
import type { ThemeStat } from "@/lib/analytics";
import { useFilter } from "@/lib/filter-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { sentimentScoreColor } from "@/lib/ui";
import { ArrowUpDown, Check } from "lucide-react";

type SortKey = "count" | "sentiment";

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const w = 64;
  const h = 22;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ThemeBreakdown({ data }: { data: ThemeStat[] }) {
  const [sort, setSort] = useState<SortKey>("count");
  const { filter, toggleTheme } = useFilter();

  const sorted = [...data].sort((a, b) =>
    sort === "count" ? b.count - a.count : a.avgSentiment - b.avgSentiment,
  );
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Theme breakdown</CardTitle>
          <CardDescription>
            Mention volume and sentiment by theme · click to cross-filter
          </CardDescription>
        </div>
        <button
          type="button"
          onClick={() => setSort((s) => (s === "count" ? "sentiment" : "count"))}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowUpDown className="size-3.5" />
          {sort === "count" ? "By volume" : "By sentiment"}
        </button>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex items-center gap-3 px-1.5 pb-1 text-overline font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="flex-1">Theme</span>
          <span className="hidden w-16 text-right sm:block">Trend</span>
          <span className="w-12 text-right">Sent.</span>
          <span className="w-10 text-right">Count</span>
        </div>
        {sorted.map((stat) => {
          const active = filter.themes.includes(stat.theme);
          const dim = filter.themes.length > 0 && !active;
          const color = sentimentScoreColor(stat.avgSentiment);
          return (
            <button
              key={stat.theme}
              type="button"
              onClick={() => toggleTheme(stat.theme)}
              aria-pressed={active}
              className={cn(
                "group flex items-center gap-3 rounded-md px-1.5 py-2 text-left transition-opacity hover:bg-muted",
                dim && "opacity-45",
              )}
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {active && <Check className="size-3.5 text-primary" />}
                  {stat.theme}
                </span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(stat.count / maxCount) * 100}%`, backgroundColor: color }}
                  />
                </div>
              </div>
              <span className="hidden w-16 justify-end sm:flex">
                <Sparkline values={stat.trend} color={color} />
              </span>
              <span
                className="w-12 text-right text-xs font-semibold tabular-nums"
                style={{ color }}
              >
                {stat.avgSentiment > 0 ? "+" : ""}
                {stat.avgSentiment.toFixed(2)}
              </span>
              <span className="w-10 text-right text-sm font-semibold tabular-nums text-foreground">
                {stat.count}
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
