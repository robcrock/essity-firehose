"use client";

import type { CompetitiveStat } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SENTIMENT_COLORS } from "@/lib/ui";

export function CompetitivePanel({ data }: { data: CompetitiveStat[] }) {
  const hasData = data.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competitive mentions</CardTitle>
        <CardDescription>Share of voice and sentiment when rivals are named</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!hasData ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No competitor mentions in the current selection.
          </p>
        ) : (
          data
            .filter((d) => d.count > 0)
            .map((d) => (
              <div key={d.competitor} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{d.competitor}</span>
                  <span className="text-muted-foreground">
                    {d.count} {d.count === 1 ? "mention" : "mentions"} · {d.share}% SOV
                  </span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                  {(["positive", "neutral", "negative"] as const).map((s) => {
                    const val = d[s];
                    if (!val) return null;
                    return (
                      <div
                        key={s}
                        style={{
                          width: `${(val / d.count) * 100}%`,
                          backgroundColor: SENTIMENT_COLORS[s],
                        }}
                        title={`${val} ${s}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))
        )}
        {hasData && (
          <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
            {(["positive", "neutral", "negative"] as const).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 capitalize">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: SENTIMENT_COLORS[s] }}
                  aria-hidden
                />
                {s}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
