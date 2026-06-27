"use client";

import { useFilter } from "@/lib/filter-context";
import { TIME_RANGES, THEMES, type Rating, type Theme } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ListFilter, RotateCcw, Search, ShieldCheck, Star } from "lucide-react";

const RATINGS: Rating[] = [5, 4, 3, 2, 1];

export function FilterBar() {
  const {
    filter,
    setTimeRange,
    toggleRating,
    setVerifiedOnly,
    toggleTheme,
    setKeyword,
    reset,
    hasActiveFilters,
  } = useFilter();

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2.5 px-4 py-3 sm:px-6">
        {/* Time range segmented control */}
        <div
          role="group"
          aria-label="Time range"
          className="inline-flex items-center rounded-lg border border-border bg-card p-0.5 shadow-sm"
        >
          {TIME_RANGES.map((range) => {
            const active = filter.timeRange === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                aria-pressed={active}
                className={cn(
                  "rounded-[7px] px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {range}
              </button>
            );
          })}
        </div>

        {/* Rating chips */}
        <div role="group" aria-label="Star rating" className="inline-flex items-center gap-1">
          {RATINGS.map((rating) => {
            const active = filter.ratings.includes(rating);
            return (
              <button
                key={rating}
                type="button"
                onClick={() => toggleRating(rating)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {rating}
                <Star
                  className={cn("size-3", active ? "fill-primary text-primary" : "fill-muted-foreground/40 text-muted-foreground/40")}
                />
              </button>
            );
          })}
        </div>

        {/* Theme multi-select */}
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm" className="gap-1.5">
                <ListFilter className="size-3.5" />
                Themes
                {filter.themes.length > 0 && (
                  <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {filter.themes.length}
                  </span>
                )}
              </Button>
            }
          />
          <PopoverContent align="start" className="w-64 gap-0 p-1.5">
            <div className="px-2 py-1.5 text-overline font-semibold uppercase tracking-wide text-muted-foreground">
              Filter by theme
            </div>
            {THEMES.map((theme: Theme) => {
              const active = filter.themes.includes(theme);
              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() => toggleTheme(theme)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <span className={cn(active && "font-medium text-foreground")}>{theme}</span>
                  {active && <Check className="size-4 text-primary" />}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>

        {/* Verified toggle */}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground has-[[data-checked]]:border-primary has-[[data-checked]]:text-foreground">
          <Checkbox
            checked={filter.verifiedOnly}
            onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
          />
          <ShieldCheck className="size-3.5" />
          Verified only
        </label>

        {/* Keyword search */}
        <div className="relative min-w-40 flex-1 sm:max-w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={filter.keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search reviews…"
            aria-label="Search review text"
            className="pl-8"
          />
        </div>

        {/* Reset */}
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={!hasActiveFilters}
          className="gap-1.5 text-muted-foreground"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>
    </div>
  );
}
