import type { RangeKey } from "@/components/layout/date-filter-bar";

/**
 * Pure date-preset math, directive-free on purpose.
 *
 * Extracted out of `use-date-range.ts` (a `"use client"` module) because a
 * Server Component cannot call into a client-directive module — every export
 * of a `"use client"` file becomes an opaque client reference once imported
 * server-side, so a plain function stops being callable there. Before this
 * extraction, `inventory/page.tsx` (a Server Component) duplicated this exact
 * arithmetic under its own name (`defaultRangeParams` / `PRESET_KEYS_DAYS`)
 * rather than importing it — correct at the time, but duplicated logic here
 * is exactly the displayed-vs-actual-scope bug class this feature already
 * spent two fix rounds on. Both call sites now import from here instead.
 */

export const RANGE_DAYS: Record<Exclude<RangeKey, null>, number> = {
  "7d": 7,
  "30d": 30,
  "60d": 60,
  "90d": 90,
};

export const iso = (d: Date) => d.toISOString().slice(0, 10);

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
