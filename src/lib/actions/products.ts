"use server";

import { unstable_rethrow } from "next/navigation";
import { AdminApiError, adminFetch, operatorMessage } from "@/lib/medusa-admin";
import {
  getProductForm,
  type LoadedProductForm,
  type ProductFormPayload,
} from "@/lib/data/product-form";
// ⚠ Do NOT re-export a type from a "use server" file — see the note in
// ./orders.ts. It becomes a runtime export and the module throws
// ReferenceError at request time, with all four local checks still green.
import { run, type ActionResult } from "./run";
import { validateProductImageFiles } from "@/lib/product-media";

type UploadResponse = {
  files: { id: string; url: string }[];
};

/**
 * Sends image bytes to Medusa, which then writes them to the backend's R2
 * provider. The browser never receives R2 credentials or the admin JWT.
 */
export async function uploadProductImages(
  files: File[],
): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  const validation = validateProductImageFiles(files);
  if (validation.length) return { ok: false, error: validation[0] };

  const body = new FormData();
  for (const file of files) body.append("files", file);

  try {
    const response = await adminFetch<UploadResponse>("/admin/uploads", {
      method: "POST",
      body,
    });
    return { ok: true, urls: response.files.map((file) => file.url) };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[admin-action] product image upload failed", err);
    return { ok: false, error: operatorMessage(err) };
  }
}

/**
 * Product create/edit mutations, behind Settings → Product Management.
 *
 * Both go to `/admin/pg/products` rather than Medusa's native product routes
 * because the storefront reads products through a metadata contract the native
 * routes know nothing about — see
 * `backend/src/api/admin/pg/products/product-form.ts`.
 *
 * The backend refuses either call for anyone below `admin` (403) and returns a
 * field-level message for a form that doesn't validate (400); `run()` surfaces
 * the backend's own wording, so a refusal reads as a refusal rather than a
 * silent no-op.
 */

export async function createProduct(
  form: ProductFormPayload,
): Promise<ActionResult> {
  return run("/admin/pg/products", "POST", "/settings", form);
}

/**
 * ⚠ PERMANENT. Order history survives (lines snapshot their data), but the
 * product's variants, inventory items, stocked quantities and staff holds do
 * not, and open carts holding them go stale. Only ever call this from an
 * explicit, confirmed operator action — see the confirmation copy in
 * `settings-screen.tsx`, which states exactly that.
 */
export async function deleteProduct(id: string): Promise<ActionResult> {
  return run(`/admin/pg/products/${id}/delete`, "POST", "/settings");
}

export async function updateProduct(
  id: string,
  form: ProductFormPayload,
): Promise<ActionResult> {
  return run(`/admin/pg/products/${id}`, "POST", "/settings", form);
}

/**
 * On-demand load behind the list's Edit button. The Settings list and the form
 * need different shapes — the list is a summary row, the form needs every
 * option value, variant and metadata descriptor — so the row can't just be
 * handed over; it's fetched when a product is actually opened.
 */
export async function fetchProductForm(
  id: string,
): Promise<
  { ok: true; form: LoadedProductForm } | { ok: false; error: string }
> {
  try {
    return { ok: true, form: await getProductForm(id) };
  } catch (err) {
    // Same redirect-swallowing trap as `run()` — see its comment.
    unstable_rethrow(err);
    const level =
      err instanceof AdminApiError && err.status < 500 ? "warn" : "error";
    console[level](`[admin-action] GET product form ${id} failed`, err);
    return { ok: false, error: operatorMessage(err) };
  }
}
