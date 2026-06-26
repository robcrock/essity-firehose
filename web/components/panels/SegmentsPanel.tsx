"use client";

import type { SegmentStat } from "@/lib/analytics";
import { useFilter } from "@/lib/filter-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { sentimentScoreColor } from "@/lib/ui";
import { Activity, BedDouble, HeartHandshake, Stethoscope, Sun, User } from "lucide-react";
import type { UseCase } from "@/lib/types";

const ICONS: Record<UseCase, React.ComponentType<{ className?: string }>> = {
  "post-surgery": Stethoscope,
  "stress-incontinence": Activity,
  active: Sun,
  overnight: BedDouble,
  caregiver: HeartHandshake,
  general: User,
};

export function SegmentsPanel({ data }: { data: SegmentStat[] }) {
  const { filter, setSegment } = useFilter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer segments</CardTitle>
        <CardDescription>By use case · click a card to cross-filter</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {data.map((seg) => {
            const Icon = ICONS[seg.useCase];
            const active = filter.segment === seg.useCase;
            const dim = filter.segment !== null && !active;
            const color = sentimentScoreColor(seg.avgSentiment);
            return (
              <button
                key={seg.useCase}
                type="button"
                onClick={() => setSegment(seg.useCase)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-3 text-left transition-all",
                  active
                    ? "border-primary bg-accent/60 shadow-sm"
                    : "border-border bg-card hover:border-primary/40",
                  dim && "opacity-50",
                )}
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-4 text-muted-foreground" />
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                </div>
                <span className="text-xs font-medium leading-tight text-foreground text-balance">
                  {seg.label}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                    {seg.count}
                  </span>
                  <span
                    className="text-xs font-medium tabular-nums"
                    style={{ color }}
                  >
                    {seg.netSentiment > 0 ? "+" : ""}
                    {seg.netSentiment}% net
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
