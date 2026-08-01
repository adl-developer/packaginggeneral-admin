"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { AdminApiError, adminFetch } from "@/lib/medusa-admin";

/**
 * Shared server-action runner.
 *
 * Extracted from `inventory.ts` (was the first mutation seam) so `orders.ts`
 * doesn't hand-copy it — a second copy would drift from this one the first
 * time either screen's error handling changed.
 */
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function run(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  revalidate: string,
  body?: unknown,
): Promise<ActionResult> {
  try {
    await adminFetch(path, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    revalidatePath(revalidate);
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
