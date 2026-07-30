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
 * Range STATE only — no filtering.
 *
 * Extracted from useDateFilter because Inventory filters server-side (the
 * "Ordered in range" column is computed in the backend), so it needs the
 * control's state without the client-side Order[] filtering.
 */
export function useDateRange(initial?: Exclude<RangeKey, null>) {
  const first = initial ? presetRange(initial) : { from: "", to: "" };
  const [start, setStart] = React.useState(first.from);
  const [end, setEnd] = React.useState(first.to);
  const [range, setRange] = React.useState<RangeKey>(initial ?? null);

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
