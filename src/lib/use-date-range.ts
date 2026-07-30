"use client";

import * as React from "react";
import type { RangeKey } from "@/components/layout/date-filter-bar";

export const RANGE_DAYS: Record<Exclude<RangeKey, null>, number> = {
  "7d": 7,
  "30d": 30,
  "60d": 60,
  "90d": 90,
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Start/end dates for a preset, counting back from today, INCLUSIVE of today.
 * Anchored to the real clock because these dates are written into the visible
 * inputs — a window that didn't end today would read as wrong.
 */
export function presetRange(key: Exclude<RangeKey, null>) {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - (RANGE_DAYS[key] - 1));
  return { from: iso(from), to: iso(today) };
}

/**
 * Literal seed for the hook's initial state: the EXACT window already in
 * effect (e.g. what a server component actually fetched), rather than a
 * preset key the hook would have to re-derive from "now". Use this whenever
 * the caller already knows the real start/end/range — re-deriving "last 30
 * days from now" client-side can disagree with a window that was resolved
 * moments (or days) earlier, which is exactly the kind of displayed-vs-actual
 * mismatch this hook exists to avoid.
 */
export type DateRangeSeed = { start: string; end: string; range: RangeKey };

/**
 * Range STATE only — no filtering.
 *
 * Extracted from useDateFilter because Inventory filters server-side (the
 * "Ordered in range" column is computed in the backend), so it needs the
 * control's state without the client-side Order[] filtering.
 *
 * Accepts either a bare preset key (recomputed from "now" — what Overview/
 * Orders want for "start me on Last 30d, today") or a full `DateRangeSeed`
 * (what Inventory wants: "start me on the EXACT window the server already
 * fetched"). Omit entirely for the all-time default.
 */
export function useDateRange(
  initial?: Exclude<RangeKey, null> | DateRangeSeed,
) {
  const seed: { from: string; to: string; range: RangeKey } = !initial
    ? { from: "", to: "", range: null }
    : typeof initial === "string"
      ? { ...presetRange(initial), range: initial }
      : { from: initial.start, to: initial.end, range: initial.range };

  const [start, setStart] = React.useState(seed.from);
  const [end, setEnd] = React.useState(seed.to);
  const [range, setRange] = React.useState<RangeKey>(seed.range);

  const applyPreset = React.useCallback((key: Exclude<RangeKey, null>) => {
    const { from, to } = presetRange(key);
    setStart(from);
    setEnd(to);
    setRange(key);
  }, []);

  const clearRange = React.useCallback(() => {
    setStart("");
    setEnd("");
    setRange(null);
  }, []);

  const editStart = React.useCallback((v: string) => {
    setStart(v);
    setRange(null);
  }, []);

  const editEnd = React.useCallback((v: string) => {
    setEnd(v);
    setRange(null);
  }, []);

  return { start, end, range, applyPreset, clearRange, editStart, editEnd };
}
