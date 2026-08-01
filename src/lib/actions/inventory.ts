"use server";

import { run, type ActionResult } from "./run";

export type { ActionResult };

/**
 * Inventory mutations.
 *
 * Server actions rather than `lib/store.tsx` (which the mock screens use)
 * because every one of these needs the admin bearer token, and that token lives
 * in an httpOnly cookie the browser must never see.
 */

export async function addStock(
  variantId: string,
  delta: number,
): Promise<ActionResult> {
  return run(`/admin/pg/inventory/${variantId}/stock`, "POST", "/inventory", {
    delta,
  });
}

export async function reserveStock(
  variantId: string,
  quantity: number,
  reason: string,
): Promise<ActionResult> {
  return run(`/admin/pg/inventory/${variantId}/reserve`, "POST", "/inventory", {
    quantity,
    reason,
  });
}

export async function releaseReservation(id: string): Promise<ActionResult> {
  return run(`/admin/pg/inventory/reservations/${id}`, "DELETE", "/inventory");
}

export async function setVariantThreshold(
  variantId: string,
  threshold: number | null,
): Promise<ActionResult> {
  return run(`/admin/pg/inventory/${variantId}/threshold`, "PATCH", "/inventory", {
    threshold,
  });
}

export async function setProductThreshold(
  productId: string,
  threshold: number | null,
): Promise<ActionResult> {
  return run(
    `/admin/pg/inventory/product/${productId}/threshold`,
    "PATCH",
    "/inventory",
    { threshold },
  );
}
