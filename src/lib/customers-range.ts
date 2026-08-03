import type { RangeKey } from "@/components/layout/date-filter-bar";
import { RANGE_DAYS } from "@/lib/date-range-math";

/**
 * URL <-> date-range plumbing for `/customers`, directive-free so both the
 * Server Component (`customers/page.tsx`) and the client screen
 * (`components/customers/customers-screen.tsx`) can import it — the same
 * reason `pagination.ts` and `date-range-math.ts` exist.
 *
 * Type-only import of `RangeKey` from a `"use client"` module is fine: types
 * are erased, so nothing client-side is pulled into the server bundle
 * (`date-range-math.ts` already does exactly this).
 */

export function isRangeKey(v: string): v is Exclude<RangeKey, null> {
  return Object.prototype.hasOwnProperty.call(RANGE_DAYS, v);
}

export type CustomersLinkParams = {
  start?: string;
  end?: string;
  range?: RangeKey;
};

/**
 * The canonical /customers URL for a date window.
 *
 * One builder for every navigation, so links from the chips and from the date
 * inputs are byte-identical. An empty window omits every param, which is what
 * makes "clear the filter" simply `/customers` rather than a URL carrying
 * three empty strings.
 *
 * `range` is only ever emitted alongside real dates — a chip key with no
 * window would highlight a filter that isn't in effect.
 */
export function customersHref(params: CustomersLinkParams): string {
  const qs = new URLSearchParams();
  if (params.start) qs.set("start", params.start);
  if (params.end) qs.set("end", params.end);
  if (params.range && (params.start || params.end)) {
    qs.set("range", params.range);
  }
  const s = qs.toString();
  return `/customers${s ? `?${s}` : ""}`;
}
