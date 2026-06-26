"use client";

import type { NegativeDriver } from "@/lib/analytics";
import { useFilter } from "@/lib/filter-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export function NegativeDrivers({ data }: { data: NegativeDriver[] }) {
  const { toggleTheme } = useFilter();
  const top = data.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="size-4 text-negative" />
          What&apos;s driving negative reviews
        </CardTitle>
        <CardDescription>Top complaint themes with a representative quote</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {top.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No negative reviews in the current selection.
          </p>
        ) : (
          top.map((d, i) => (
            <div
              key={d.theme}
              className="flex flex-col gap-1.5 rounded-lg border border-border bg-negative-muted/40 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggleTheme(d.theme)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
                >
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-negative/15 text-xs font-bold text-negative">
                    {i + 1}
                  </span>
                  {d.theme}
                </button>
                <span className="shrink-0 text-xs font-medium tabular-nums text-negative">
                  {d.count} {d.count === 1 ? "mention" : "mentions"}
                </span>
              </div>
              <blockquote className="border-l-2 border-negative/30 pl-2.5 text-sm italic leading-relaxed text-muted-foreground">
                &ldquo;{d.quote.body}&rdquo;
              </blockquote>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
