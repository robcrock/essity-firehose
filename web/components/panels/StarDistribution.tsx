"use client";

import { useFilter } from "@/lib/filter-context";
import type { Rating } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export function StarDistribution({ data }: { data: { star: number; count: number }[] }) {
  const { filter, toggleRating } = useFilter();
  const total = data.reduce((s, d) => s + d.count, 0);
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Star distribution</CardTitle>
        <CardDescription>Click a row to filter by rating</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {data.map(({ star, count }) => {
          const pct = total ? Math.round((count / total) * 100) : 0;
          const active = filter.ratings.includes(star as Rating);
          const dim = filter.ratings.length > 0 && !active;
          return (
            <button
              key={star}
              type="button"
              onClick={() => toggleRating(star as Rating)}
              aria-pressed={active}
              className={cn(
                "group flex items-center gap-3 rounded-md px-1.5 py-1 text-left transition-opacity hover:bg-muted",
                dim && "opacity-45",
              )}
            >
              <span className="inline-flex w-10 shrink-0 items-center gap-0.5 text-sm font-medium tabular-nums text-foreground">
                {star}
                <Star className="size-3 fill-neutral text-neutral" />
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {count.toLocaleString()} · {pct}%
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
