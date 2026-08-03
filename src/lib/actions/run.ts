"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { AdminApiError, adminFetch, operatorMessage } from "@/lib/medusa-admin";

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
    // The full diagnostic — method, path, status, backend message — goes to
    // the SERVER log, which is where it's actionable. What goes back to the
    // browser is `operatorMessage()`: the backend's own sentence for a 4xx
    // refusal, never the route and resource id `err.message` embeds.
    //
    // A 4xx is an expected refusal (a self-demotion, an already-claimed
    // order), so it logs at warn; anything else is a genuine fault.
    const level =
      err instanceof AdminApiError && err.status < 500 ? "warn" : "error";
    console[level](`[admin-action] ${method} ${path} failed`, err);
    return { ok: false, error: operatorMessage(err) };
  }
}
