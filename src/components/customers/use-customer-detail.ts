"use client";

import * as React from "react";
import { fetchCustomerDetail } from "@/lib/actions/customers";
import type { CustomerDetail } from "@/lib/data/customers";

export type CustomerDetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; customer: CustomerDetail };

/**
 * Owns the "one customer-detail dialog, fetched on demand" state machine for
 * `CustomersScreen`.
 *
 * Same monotonic-token race guard as `use-order-detail.ts`, for the same
 * reason: open A (slow request), close, open B (fast — dialog correctly shows
 * B), then A's request finally resolves and silently overwrites the dialog
 * with A's data. Every async call captures the token in effect when it was
 * made and refuses to touch state once the ref has moved on.
 *
 * Read-only, so there is no `mutate` here — the portal has no customer
 * mutation surface, and this hook deliberately doesn't invent one.
 */
export function useCustomerDetail() {
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [detailState, setDetailState] =
    React.useState<CustomerDetailState | null>(null);
  const tokenRef = React.useRef(0);

  const open = React.useCallback(async (id: string) => {
    const token = ++tokenRef.current;
    setDetailId(id);
    setDetailState({ status: "loading" });
    const result = await fetchCustomerDetail(id);
    if (tokenRef.current !== token) return; // superseded by a close/open/retry
    setDetailState(
      result.ok
        ? { status: "loaded", customer: result.customer }
        : { status: "error", message: result.error },
    );
  }, []);

  const close = React.useCallback(() => {
    tokenRef.current++; // invalidates anything still in flight for this session
    setDetailId(null);
    setDetailState(null);
  }, []);

  return { detailId, detailState, open, close };
}
