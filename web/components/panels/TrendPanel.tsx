"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Series = "rating" | "sentiment";

function TrendTooltip({ active, payload, series }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as TrendPoint;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-foreground">Week of {p.label}</div>
      <div className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
        {series === "rating" ? (
          <span>
            Avg rating <span className="font-semibold text-foreground">{p.avgRating.toFixed(2)}</span>
          </span>
        ) : (
          <span>
            Net sentiment{" "}
            <span className="font-semibold text-foreground">
              {p.netSentiment > 0 ? "+" : ""}
              {p.netSentiment.toFixed(0)}%
            </span>
          </span>
        )}
        <span>{p.count} reviews</span>
      </div>
    </div>
  );
}

export function TrendPanel({ data }: { data: TrendPoint[] }) {
  const [series, setSeries] = useState<Series>("rating");
  const dataKey = series === "rating" ? "avgRating" : "netSentiment";

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Sentiment & rating over time</CardTitle>
          <CardDescription>Weekly trend across the selected period</CardDescription>
        </div>
        <div className="inline-flex shrink-0 items-center rounded-lg border border-border bg-card p-0.5">
          {(["rating", "sentiment"] as Series[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeries(s)}
              aria-pressed={series === s}
              className={cn(
                "rounded-[7px] px-2.5 py-1 text-xs font-medium transition-colors",
                series === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "rating" ? "Avg rating" : "Net sentiment"}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                minTickGap={20}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                domain={series === "rating" ? [1, 5] : [-100, 100]}
                width={44}
              />
              <Tooltip
                content={<TrendTooltip series={series} />}
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                fill="url(#trendFill)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
