"use server";

import { unstable_rethrow } from "next/navigation";
import { AdminApiError } from "@/lib/medusa-admin";
import { getOrderDetail, type OrderDetail } from "@/lib/data/orders";
import type { OrderStage } from "@/lib/stage-mapping";
import { run, type ActionResult } from "./run";

export type { ActionResult };

/**
 * Order mutations + the on-demand detail fetch behind the "View" action.
 *
 * Server actions rather than `lib/store.tsx` (which the mock screens use)
 * because every one of these needs the admin bearer token, and that token
 * lives in an httpOnly cookie the browser must never see.
 *
 * ⚠ No `assignWorker`. `backend/src/api/admin/pg/orders/[id]/claim/route.ts`
 * is the only assignment endpoint and it is self-assignment only — it
 * resolves the CALLING admin as the assignee (`resolveActor(req)`) and 409s
 * if someone else already claimed the order. There is no route anywhere
 * under `backend/src/api/admin/pg/orders/[id]/` that accepts an arbitrary
 * `assigned_to_id` for a DIFFERENT user (the sibling `ops/route.ts` only
 * exposes a GET). Adding one is a backend change and out of scope for this
 * task, so the dialog's assign control was changed to a self-claim button
 * (`order-detail-dialog.tsx`) instead of the old "assign to any team member"
 * dropdown. Flagged for the controller — a real "assign to someone else"
 * flow needs a new backend route.
 */

export async function claimOrder(orderId: string): Promise<ActionResult> {
  return run(`/admin/pg/orders/${orderId}/claim`, "POST", "/orders");
}

/**
 * ⚠ `"cancelled"` is refused here.
 *
 * Cancelling reaches Medusa's `cancelOrderWorkflow`, which refunds every
 * captured payment — the exact money path `backend/src/api/admin/pg/orders/
 * [id]/cancel/route.ts` is parked behind `PG_ENABLE_ORDER_REFUNDS`. The
 * portal deliberately offers no cancel transition while that is parked
 * (`NEXT_STAGE` never yields "cancelled" and `onRequestCancel` is unwired),
 * but a server action's id ships in the `/orders` client bundle and can be
 * invoked directly, so refusing here as well costs nothing.
 *
 * This is CONVENIENCE, NOT ACCESS CONTROL — the real boundary is the backend,
 * which now role-gates the cancel stage and blocks it outright on an order
 * with a captured payment. Remove this branch when the cancel flow is
 * genuinely wired (Task 11/12), not before.
 */
export async function setStage(
  orderId: string,
  stage: OrderStage,
): Promise<ActionResult> {
  if (stage === "cancelled") {
    return {
      ok: false,
      error:
        "Cancelling an order isn't available in the portal yet — cancel it from the Medusa admin instead.",
    };
  }
  return run(`/admin/pg/orders/${orderId}/stage`, "POST", "/orders", {
    stage,
  });
}

export async function addNote(
  orderId: string,
  note: string,
): Promise<ActionResult> {
  return run(`/admin/pg/orders/${orderId}/notes`, "POST", "/orders", {
    note,
  });
}

/**
 * On-demand fetch behind the "View" action. The orders list (`getOrders`)
 * and the order detail (`getOrderDetail`) are different endpoints returning
 * different shapes (`OrderListRow` vs `OrderDetail`), so the list page can't
 * just hand the dialog a row — it asks for the real detail here, once, when
 * a row is actually opened.
 */
export async function fetchOrderDetail(
  id: string,
): Promise<{ ok: true; order: OrderDetail } | { ok: false; error: string }> {
  try {
    const order = await getOrderDetail(id);
    return { ok: true, order };
  } catch (err) {
    // Same redirect-swallowing trap as `run()` — see its comment.
    unstable_rethrow(err);
    if (err instanceof AdminApiError) {
      return { ok: false, error: err.message };
    }
    return { ok: false, error: "Could not reach the backend. Try again." };
  }
}
