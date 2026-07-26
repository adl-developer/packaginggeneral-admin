"use client";

import * as React from "react";
import type { RangeKey } from "@/components/layout/date-filter-bar";
import type { Order } from "@/lib/data/types";

const DAYS: Record<Exclude<RangeKey, null>, number> = {
  "7d": 7,
  "30d": 30,
  "60d": 60,
  "90d": 90,
};

/**
 * Shared date-range filter behind the filter bar on Overview and Orders.
 *
 * The mock fixtures are dated mid-2026, so "Last 7d" relative to the real
 * clock would empty the table. Ranges are therefore measured back from the
 * most recent order in the data — which is what the designs depict.
 */
export function useDateFilter(orders: Order[]) {
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [range, setRange] = React.useState<RangeKey>(null);

  const latest = React.useMemo(
    () =>
      orders.reduce(
        (max, o) => (o.placedAt > max ? o.placedAt : max),
        orders[0]?.placedAt ?? "",
      ),
    [orders],
  );

  const filtered = React.useMemo(() => {
    let from = start;
    let to = end;

    if (range && latest) {
      const anchor = new Date(latest);
      const back = new Date(anchor);
      back.setDate(anchor.getDate() - DAYS[range]);
      from = back.toISOString().slice(0, 10);
      to = latest;
    }

    return orders.filter((o) => {
      if (from && o.placedAt < from) return false;
      if (to && o.placedAt > to) return false;
      return true;
    });
  }, [orders, start, end, range, latest]);

  return { start, end, range, setStart, setEnd, setRange, filtered };
}
