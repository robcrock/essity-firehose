"use client";

import type { Insight } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Lightbulb, Sparkles } from "lucide-react";

const toneStyles: Record<Insight["tone"], { wrap: string; icon: string }> = {
  positive: {
    wrap: "border-positive/25 bg-positive-muted/40",
    icon: "text-positive",
  },
  negative: {
    wrap: "border-negative/25 bg-negative-muted/40",
    icon: "text-negative",
  },
  neutral: {
    wrap: "border-border bg-muted/40",
    icon: "text-muted-foreground",
  },
};

export function AutoInsights({ insights }: { insights: Insight[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          Automated insights
        </CardTitle>
        <CardDescription>Generated from the current selection</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Not enough data in this selection to surface insights.
          </p>
        ) : (
          insights.map((insight, i) => {
            const tone = toneStyles[insight.tone];
            const Icon =
              insight.tone === "positive"
                ? ArrowUpRight
                : insight.tone === "negative"
                  ? ArrowDownRight
                  : Lightbulb;
            return (
              <div
                key={i}
                className={cn(
                  "flex gap-3 rounded-lg border p-3 transition-colors",
                  tone.wrap,
                )}
              >
                <div className="mt-0.5 shrink-0">
                  <Icon className={cn("size-4", tone.icon)} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium leading-snug text-foreground text-pretty">
                    {insight.headline}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
                    {insight.detail}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
