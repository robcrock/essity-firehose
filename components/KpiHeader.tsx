"use client";

import type { Kpis } from "@/lib/analytics";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus, Star } from "lucide-react";

type DeltaTone = "up-good" | "down-good";

function Delta({
  value,
  format,
  tone = "up-good",
}: {
  value: number | null;
  format: (v: number) => string;
  tone?: DeltaTone;
}) {
  if (value === null) {
    return <span className="text-xs text-muted-foreground">vs prior — n/a</span>;
  }
  const flat = Math.abs(value) < 0.05;
  const positive = tone === "up-good" ? value > 0 : value < 0;
  const color = flat
    ? "text-muted-foreground"
    : positive
      ? "text-positive"
      : "text-negative";
  const Icon = flat ? Minus : value > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", color)}>
      <Icon className="size-3" />
      {format(Math.abs(value))}
      <span className="font-normal text-muted-foreground"> vs prior</span>
    </span>
  );
}

function KpiCard({
  label,
  children,
  delta,
}: {
  label: string;
  children: React.ReactNode;
  delta?: React.ReactNode;
}) {
  return (
    <Card className="gap-2 p-4">
      <span className="text-overline font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">{children}</div>
      <div className="min-h-4">{delta}</div>
    </Card>
  );
}

export function KpiHeader({ kpis }: { kpis: Kpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <KpiCard
        label="Average rating"
        delta={<Delta value={kpis.avgRatingDelta} format={(v) => v.toFixed(2)} />}
      >
        <span className="text-kpi font-semibold tabular-nums tracking-tight">
          {kpis.avgRating.toFixed(2)}
        </span>
        <Star className="size-5 translate-y-0.5 fill-neutral text-neutral" />
      </KpiCard>

      <KpiCard
        label="Reviews in period"
        delta={<Delta value={kpis.countDelta} format={(v) => v.toFixed(0)} />}
      >
        <span className="text-kpi font-semibold tabular-nums tracking-tight">
          {kpis.count.toLocaleString()}
        </span>
      </KpiCard>

      <KpiCard
        label="Net sentiment"
        delta={<Delta value={kpis.netSentimentDelta} format={(v) => `${v.toFixed(0)}pt`} />}
      >
        <span className="text-kpi font-semibold tabular-nums tracking-tight">
          {kpis.netSentiment > 0 ? "+" : ""}
          {kpis.netSentiment.toFixed(0)}
        </span>
        <span className="text-sm text-muted-foreground">%</span>
      </KpiCard>

      <KpiCard label="Verified share">
        <span className="text-kpi font-semibold tabular-nums tracking-tight">
          {kpis.verifiedShare.toFixed(0)}
        </span>
        <span className="text-sm text-muted-foreground">%</span>
      </KpiCard>

      <KpiCard label="Top theme this period">
        {kpis.topTheme ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-semibold leading-tight tracking-tight text-balance">
              {kpis.topTheme.theme}
            </span>
            <span className="text-xs text-muted-foreground">
              {kpis.topTheme.count} mentions
            </span>
          </div>
        ) : (
          <span className="text-lg font-semibold text-muted-foreground">—</span>
        )}
      </KpiCard>
    </div>
  );
}
