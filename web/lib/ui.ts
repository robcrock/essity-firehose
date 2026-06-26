import type { Sentiment } from "./types";

export const SENTIMENT_COLORS: Record<Sentiment, string> = {
  positive: "var(--positive)",
  neutral: "var(--neutral)",
  negative: "var(--negative)",
};

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
};

// Map a -1..1 sentiment score to a calm color (red → amber → green)
export function sentimentScoreColor(score: number): string {
  if (score >= 0.25) return "var(--positive)";
  if (score <= -0.2) return "var(--negative)";
  return "var(--neutral)";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDelta(delta: number | null, opts?: { suffix?: string; digits?: number }) {
  if (delta === null) return null;
  const digits = opts?.digits ?? 1;
  const suffix = opts?.suffix ?? "";
  const sign = delta > 0 ? "+" : delta < 0 ? "" : "";
  return `${sign}${delta.toFixed(digits)}${suffix}`;
}
