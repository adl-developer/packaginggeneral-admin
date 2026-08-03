"use server";

import { unstable_rethrow } from "next/navigation";
import { AdminApiError, operatorMessage } from "@/lib/medusa-admin";
import { getCustomerDetail, type CustomerDetail } from "@/lib/data/customers";

/**
 * The on-demand customer-detail fetch behind clicking a row on the Customers
 * screen. Read-only — there is no customer mutation surface in the portal, so
 * unlike `orders.ts` this file has no `run()` calls.
 *
 * It is a server action rather than a client fetch because the admin bearer
 * token lives in an httpOnly cookie the browser must never see.
 *
 * ⚠ Do NOT re-export types from this file — see the warning in `orders.ts`:
 * Next's server-actions loader turns `export type { X }` into a real runtime
 * export, and the module then throws `ReferenceError: X is not defined` at
 * request time while tsc, eslint, vitest and `next build` all pass.
 */
export async function fetchCustomerDetail(
  id: string,
): Promise<
  { ok: true; customer: CustomerDetail } | { ok: false; error: string }
> {
  try {
    const customer = await getCustomerDetail(id);
    return { ok: true, customer };
  } catch (err) {
    // Same redirect-swallowing trap as `run()` — see its comment. Same split
    // too: diagnostic to the log, operator-safe sentence to the dialog.
    unstable_rethrow(err);
    const level =
      err instanceof AdminApiError && err.status < 500 ? "warn" : "error";
    console[level](`[admin-action] GET customer detail ${id} failed`, err);
    return { ok: false, error: operatorMessage(err) };
  }
}
