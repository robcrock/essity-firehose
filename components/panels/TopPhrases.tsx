"use client";

import type { PhraseChip } from "@/lib/analytics";
import { useFilter } from "@/lib/filter-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ThumbsDown, ThumbsUp } from "lucide-react";

function chipSize(count: number, max: number): string {
  const ratio = count / max;
  if (ratio > 0.66) return "text-base";
  if (ratio > 0.33) return "text-sm";
  return "text-xs";
}

function ChipGroup({
  phrases,
  tone,
  onSelect,
}: {
  phrases: PhraseChip[];
  tone: "positive" | "negative";
  onSelect: (p: string) => void;
}) {
  const max = Math.max(...phrases.map((p) => p.count), 1);
  return (
    <div className="flex flex-wrap gap-1.5">
      {phrases.length === 0 ? (
        <span className="text-sm text-muted-foreground">No phrases in selection.</span>
      ) : (
        phrases.map((p) => (
          <button
            key={p.phrase}
            type="button"
            onClick={() => onSelect(p.phrase)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium leading-none transition-colors",
              chipSize(p.count, max),
              tone === "positive"
                ? "border-positive/25 bg-positive-muted/50 text-positive-foreground hover:bg-positive-muted"
                : "border-negative/25 bg-negative-muted/50 text-negative-foreground hover:bg-negative-muted",
            )}
            style={
              tone === "positive"
                ? { color: "var(--positive)" }
                : { color: "var(--negative)" }
            }
          >
            {p.phrase}
            <span className="text-[10px] opacity-70 tabular-nums">{p.count}</span>
          </button>
        ))
      )}
    </div>
  );
}

export function TopPhrases({
  data,
}: {
  data: { positive: PhraseChip[]; negative: PhraseChip[] };
}) {
  const { setKeyword } = useFilter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top phrases</CardTitle>
        <CardDescription>Most frequent terms · click to search reviews</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1.5 text-overline font-semibold uppercase tracking-wide text-positive">
            <ThumbsUp className="size-3.5" /> Positive
          </span>
          <ChipGroup phrases={data.positive} tone="positive" onSelect={setKeyword} />
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <span className="inline-flex items-center gap-1.5 text-overline font-semibold uppercase tracking-wide text-negative">
            <ThumbsDown className="size-3.5" /> Negative
          </span>
          <ChipGroup phrases={data.negative} tone="negative" onSelect={setKeyword} />
        </div>
      </CardContent>
    </Card>
  );
}
