"use client";

import * as React from "react";
import type { RangeKey } from "@/components/layout/date-filter-bar";
import type { Order } from "@/lib/data/types";

export const RANGE_DAYS: Record<Exclude<RangeKey, null>, number> = {
  "7d": 7,
  "30d": 30,
  "60d": 60,
  "90d": 90,
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Start/end dates for a preset, counting back from today.
 *
 * The window is INCLUSIVE of today, so "Last 7d" spans today plus the previous
 * six days. Anchored to the real clock rather than to the newest order, because
 * these dates are now written into the visible inputs — showing a window that
 * didn't end today would read as wrong.
 */
export function presetRange(key: Exclude<RangeKey, null>) {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - (RANGE_DAYS[key] - 1));
  return { from: iso(from), to: iso(today) };
}

/**
 * Shared date-range filter behind the filter bar on Overview and Orders.
 *
 * Presets are just a shortcut for filling `start`/`end` — the filtering itself
 * only ever reads those two values, so a preset and a hand-typed range behave
 * identically. `range` is retained purely to highlight the active chip, and is
 * cleared as soon as either date is edited by hand.
 */
export function useDateFilter(orders: Order[]) {
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [range, setRange] = React.useState<RangeKey>(null);

  const filtered = React.useMemo(
    () =>
      orders.filter((o) => {
        if (start && o.placedAt < start) return false;
        if (end && o.placedAt > end) return false;
        return true;
      }),
    [orders, start, end],
  );

  /** Apply a preset: fills both inputs and marks the chip active. */
  const applyPreset = React.useCallback((key: Exclude<RangeKey, null>) => {
    const { from, to } = presetRange(key);
    setStart(from);
    setEnd(to);
    setRange(key);
  }, []);

  /** Clear the whole range (used when toggling the active chip back off). */
  const clearRange = React.useCallback(() => {
    setStart("");
    setEnd("");
    setRange(null);
  }, []);

  /** Hand-editing a date drops the preset highlight but keeps the value. */
  const editStart = React.useCallback((v: string) => {
    setStart(v);
    setRange(null);
  }, []);

  const editEnd = React.useCallback((v: string) => {
    setEnd(v);
    setRange(null);
  }, []);

  return {
    start,
    end,
    range,
    filtered,
    applyPreset,
    clearRange,
    editStart,
    editEnd,
  };
}
