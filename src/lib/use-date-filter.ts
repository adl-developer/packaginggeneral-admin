"use client";

import * as React from "react";
import type { Order } from "@/lib/data/types";
import { useDateRange } from "./use-date-range";

export { RANGE_DAYS, presetRange } from "./use-date-range";

/**
 * Shared date-range filter behind the filter bar on Overview and Orders.
 *
 * Range state now lives in useDateRange (Inventory needs it without the
 * filtering); this adds the client-side Order[] filter on top.
 */
export function useDateFilter(orders: Order[]) {
  const range = useDateRange();

  const filtered = React.useMemo(
    () =>
      orders.filter((o) => {
        if (range.start && o.placedAt < range.start) return false;
        if (range.end && o.placedAt > range.end) return false;
        return true;
      }),
    [orders, range.start, range.end],
  );

  return { ...range, filtered };
}
