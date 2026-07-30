"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { AdminApiError, adminFetch } from "@/lib/medusa-admin";

/**
 * Inventory mutations.
 *
 * Server actions rather than `lib/store.tsx` (which the mock screens use)
 * because every one of these needs the admin bearer token, and that token lives
 * in an httpOnly cookie the browser must never see.
 */
export type ActionResult = { ok: true } | { ok: false; error: string };

async function run(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<ActionResult> {
  try {
    await adminFetch(path, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    revalidatePath("/inventory");
    return { ok: true };
  } catch (err) {
    // adminFetch calls redirect("/login") when the session cookie is missing
    // or the backend returns 401 (see medusa-admin.ts). redirect() works by
    // THROWING a special Next.js control-flow error — rethrow it here before
    // any other handling, or the bounce-to-login never happens and the
    // operator is told "backend unreachable" when their session just died.
    unstable_rethrow(err);
    if (err instanceof AdminApiError) {
      // The backend's message is written for an operator — surface it rather
      // than replacing it with something vaguer.
      return { ok: false, error: err.message };
    }
    return { ok: false, error: "Could not reach the backend. Try again." };
  }
}

export async function addStock(
  variantId: string,
  delta: number,
): Promise<ActionResult> {
  return run(`/admin/pg/inventory/${variantId}/stock`, "POST", { delta });
}

export async function reserveStock(
  variantId: string,
  quantity: number,
  reason: string,
): Promise<ActionResult> {
  return run(`/admin/pg/inventory/${variantId}/reserve`, "POST", {
    quantity,
    reason,
  });
}

export async function releaseReservation(id: string): Promise<ActionResult> {
  return run(`/admin/pg/inventory/reservations/${id}`, "DELETE");
}

export async function setVariantThreshold(
  variantId: string,
  threshold: number | null,
): Promise<ActionResult> {
  return run(`/admin/pg/inventory/${variantId}/threshold`, "PATCH", {
    threshold,
  });
}

export async function setProductThreshold(
  productId: string,
  threshold: number | null,
): Promise<ActionResult> {
  return run(`/admin/pg/inventory/product/${productId}/threshold`, "PATCH", {
    threshold,
  });
}
