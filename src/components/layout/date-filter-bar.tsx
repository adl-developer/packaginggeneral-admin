"use client";

import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterLabel } from "@/components/ui/input";

/**
 * Figma: 1200×86 panel — bg rgba(196,188,176,0.3), 1px #c4bcb0, radius 16,
 * padding 16, gap 12. Date inputs 160×32 (radius 14) with 12px/500 muted
 * labels; range chips 32px tall, gap 6, active chip = brand fill.
 *
 * Choosing a preset WRITES the computed dates into the two inputs rather than
 * filtering behind their back, so the control always shows the window actually
 * in effect. Editing either date by hand keeps the value and just drops the
 * chip highlight; clicking the active chip again clears everything.
 */
export type RangeKey = "7d" | "30d" | "60d" | "90d" | null;

const RANGES: { key: Exclude<RangeKey, null>; label: string }[] = [
  { key: "7d", label: "Last 7d" },
  { key: "30d", label: "Last 30d" },
  { key: "60d", label: "Last 60d" },
  { key: "90d", label: "Last 90d" },
];

export function DateFilterBar({
  start,
  end,
  range,
  onStart,
  onEnd,
  onPreset,
  onClear,
  showing,
  total,
  noun = "orders",
}: {
  start: string;
  end: string;
  range: RangeKey;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  onPreset: (v: Exclude<RangeKey, null>) => void;
  onClear: () => void;
  showing: number;
  total: number;
  noun?: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-end gap-3 rounded-panel border border-line bg-[rgba(196,188,176,0.3)] p-4">
      <CalendarDays className="mb-2 size-4 shrink-0 text-muted" aria-hidden />

      <div className="flex w-40 flex-col gap-1">
        <FilterLabel htmlFor="filter-start">Start Date</FilterLabel>
        <input
          id="filter-start"
          type="date"
          value={start}
          max={end || undefined}
          onChange={(e) => onStart(e.target.value)}
          className="h-8 w-full rounded-button border border-line bg-surface px-3 text-xs text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        />
      </div>

      <div className="flex w-40 flex-col gap-1">
        <FilterLabel htmlFor="filter-end">End Date</FilterLabel>
        <input
          id="filter-end"
          type="date"
          value={end}
          min={start || undefined}
          onChange={(e) => onEnd(e.target.value)}
          className="h-8 w-full rounded-button border border-line bg-surface px-3 text-xs text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        />
      </div>

      <div className="flex items-center gap-1.5 pb-0.5">
        {RANGES.map((r) => {
          const active = range === r.key;
          return (
            <Button
              key={r.key}
              size="xs"
              variant={active ? "primary" : "outline"}
              onClick={() => (active ? onClear() : onPreset(r.key))}
              aria-pressed={active}
            >
              {r.label}
            </Button>
          );
        })}
      </div>

      <p className="mb-2 ml-auto text-xs leading-4 text-muted">
        {showing} of {total} {noun}
      </p>
    </div>
  );
}
