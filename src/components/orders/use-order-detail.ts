"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/actions/run";
import { fetchOrderDetail } from "@/lib/actions/orders";
import type { OrderDetail } from "@/lib/data/orders";

export type DetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; order: OrderDetail };

/**
 * Owns the "one order-detail dialog, fetched on demand" state machine for
 * `OrdersScreen`, and guards it against out-of-order network responses.
 *
 * Fixed 2026-08 review finding: neither `open()` nor the post-mutation
 * refetch checked that their fetch was still the one the user actually
 * wanted before calling `setState`. Reachable sequence: View A (slow
 * request), close, View B (fast — dialog now correctly shows B), then A's
 * request finally resolves and silently overwrites the dialog with A's data
 * while `detailId` still read B. Worse than a display glitch: `onAdvance`
 * reads `detailState.order.stage` for context but targets `detailId` — so a
 * stale A response could make a "Move to X" click computed from A's stage
 * apply itself to order B.
 *
 * Fix: a monotonic `tokenRef` that advances on every `open()` and `close()`
 * (the only two places the "which order session is this" changes). Every
 * async function captures the token in effect when IT was called and refuses
 * to touch state if the ref has moved on by the time it resolves — so a
 * response for a superseded session is always dropped, no matter how the
 * requests interleave.
 */
export function useOrderDetail() {
  const router = useRouter();
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [detailState, setDetailState] = React.useState<DetailState | null>(
    null,
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const tokenRef = React.useRef(0);

  const open = React.useCallback(async (id: string) => {
    const token = ++tokenRef.current;
    setDetailId(id);
    setDetailState({ status: "loading" });
    setError(null);
    setBusy(false);
    const result = await fetchOrderDetail(id);
    if (tokenRef.current !== token) return; // superseded by a close/open/retry
    setDetailState(
      result.ok
        ? { status: "loaded", order: result.order }
        : { status: "error", message: result.error },
    );
  }, []);

  const close = React.useCallback(() => {
    tokenRef.current++; // invalidates anything still in flight for this session
    setDetailId(null);
    setDetailState(null);
    setBusy(false);
    setError(null);
  }, []);

  /**
   * Runs a mutation against the CURRENTLY open order. On success it refetches
   * that order's detail (to show the new assignment/stage/note) and asks the
   * Server Component to refresh the list — the action already revalidated
   * `/orders` server-side; `router.refresh()` is what pulls that into this
   * already-mounted client tree (same pattern as Inventory's
   * `stock-dialogs.tsx`; `revalidatePath` alone doesn't push a new RSC
   * payload to an already-mounted tree).
   *
   * On failure the error is surfaced via `error` and nothing is refetched —
   * unchanged from before this fix; only the race-guarding is new.
   *
   * Every state update here is dropped if the dialog has moved on (closed,
   * or reopened onto a different order) by the time the mutation resolves —
   * `router.refresh()` still runs on success regardless, since the list is
   * genuinely stale either way.
   */
  const mutate = React.useCallback(
    async (action: (id: string) => Promise<ActionResult>) => {
      const token = tokenRef.current;
      const id = detailId;
      if (!id) return;
      setBusy(true);
      setError(null);
      const result = await action(id);
      if (!result.ok) {
        if (tokenRef.current === token) {
          setError(result.error);
          setBusy(false);
        }
        return;
      }
      router.refresh();
      if (tokenRef.current !== token) return;
      const detail = await fetchOrderDetail(id);
      if (tokenRef.current !== token) return;
      if (detail.ok) {
        setDetailState({ status: "loaded", order: detail.order });
      }
      // A refetch failure leaves the previous loaded order on screen rather
      // than replacing it with an error — the mutation itself already
      // succeeded; losing a good view because the FOLLOW-UP refetch
      // hiccuped would be worse.
      setBusy(false);
    },
    [detailId, router],
  );

  /** Dismisses a shown mutation error without touching anything else — the
   *  dialog stays open on whatever it was already showing. */
  const clearError = React.useCallback(() => setError(null), []);

  return { detailId, detailState, busy, error, open, close, mutate, clearError };
}
