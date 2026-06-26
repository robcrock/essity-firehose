"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Sentiment } from "@/lib/types";
import { SENTIMENT_COLORS, SENTIMENT_LABELS } from "@/lib/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ORDER: Sentiment[] = ["positive", "neutral", "negative"];

export function SentimentDonut({ split }: { split: Record<Sentiment, number> }) {
  const total = ORDER.reduce((s, k) => s + split[k], 0);
  const data = ORDER.map((s) => ({ name: SENTIMENT_LABELS[s], key: s, value: split[s] }));
  const posPct = total ? Math.round((split.positive / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment split</CardTitle>
        <CardDescription>Share of reviews by sentiment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="relative h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  stroke="var(--card)"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {data.map((d) => (
                    <Cell key={d.key} fill={SENTIMENT_COLORS[d.key]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const pct = total ? Math.round((d.value / total) * 100) : 0;
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                        <span className="font-medium text-foreground">{d.name}</span>
                        <span className="text-muted-foreground"> · {d.value} ({pct}%)</span>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tabular-nums tracking-tight text-positive">
                {posPct}%
              </span>
              <span className="text-overline uppercase tracking-wide text-muted-foreground">
                positive
              </span>
            </div>
          </div>
          <ul className="flex flex-1 flex-col gap-2.5">
            {data.map((d) => {
              const pct = total ? Math.round((d.value / total) * 100) : 0;
              return (
                <li key={d.key} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: SENTIMENT_COLORS[d.key] }}
                    aria-hidden
                  />
                  <span className="flex-1 text-foreground">{d.name}</span>
                  <span className="tabular-nums text-muted-foreground">{d.value}</span>
                  <span className="w-9 text-right font-medium tabular-nums text-foreground">
                    {pct}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
