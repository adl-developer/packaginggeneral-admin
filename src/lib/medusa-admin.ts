import { redirect } from "next/navigation";
import { MEDUSA_BACKEND_URL, isDemoMode } from "./auth/config";
import { clearSession, getBearerToken } from "./auth/session";

/**
 * Server-side authenticated client for Medusa's Admin API.
 *
 * Every call attaches the bearer token from the httpOnly session cookie. This
 * MUST only ever run on the server — the token is not available to the browser
 * by design.
 *
 * Inventory (`lib/data/inventory.ts`) is its first live consumer — other
 * screens still read mock fixtures via `lib/data/` and will wire onto this
 * the same way as they're migrated.
 */

export class AdminApiError extends Error {
  constructor(
    /**
     * A DIAGNOSTIC, for server logs only. It embeds the method, path, status
     * and the target resource's id — never render it in the UI. See
     * `operatorMessage()` below for what an operator may be shown.
     */
    message: string,
    readonly status: number,
    /**
     * The backend's own `message` field, verbatim and free of the request
     * diagnostics above. Our `/admin/pg/*` routes write these for an operator
     * ("You cannot remove your own super-admin role.") — this is the only part
     * of an AdminApiError that is ever safe to display, and only for the
     * statuses `operatorMessage()` allows.
     */
    readonly detail?: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

/** Fallbacks for a refusal the backend gave no usable message for. */
const BY_STATUS: Record<number, string> = {
  400: "That request wasn't valid. Refresh the page and try again.",
  403: "You don't have permission to do that.",
  404: "That item no longer exists. Refresh the page.",
  409: "Someone else changed this first. Refresh the page and try again.",
  422: "That request wasn't valid. Refresh the page and try again.",
  429: "Too many requests. Wait a moment and try again.",
};

/**
 * Longest backend message we'll put in front of an operator. Our own routes
 * write short sentences; anything past this is a stack trace, a validation
 * dump or some other internal that leaked into `message`.
 */
const MAX_DETAIL_LENGTH = 200;

/**
 * The operator-facing text for a failed admin call.
 *
 * ⚠ Never return `err.message` from here. It is the diagnostic string built
 * below — an operator once saw the literal
 * `Admin API PATCH /admin/pg/users/user_01KSK…/role failed (400): You cannot
 * remove your own super-admin role.` in a table cell. The refusal was correct;
 * the presentation leaked a route and a user id and buried the one sentence
 * that mattered.
 *
 * A 4xx is a deliberate refusal from one of our own routes, and its message is
 * written to be read — surface it. A 5xx is not: whatever it says is for the
 * log, so the operator gets a generic line instead. Callers MUST still run
 * `unstable_rethrow(err)` before calling this, or Next's redirect-to-login
 * control-flow error gets flattened into "Something went wrong".
 */
export function operatorMessage(err: unknown): string {
  if (!(err instanceof AdminApiError)) {
    return "Could not reach the backend. Try again.";
  }
  if (err.status >= 400 && err.status < 500) {
    const detail = err.detail?.trim();
    if (detail && detail.length <= MAX_DETAIL_LENGTH) return detail;
    return BY_STATUS[err.status] ?? "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export async function adminFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (isDemoMode()) {
    throw new AdminApiError(
      "adminFetch called in demo mode — screens should be reading lib/data fixtures.",
      503,
    );
  }

  const token = await getBearerToken();
  if (!token) redirect("/login");

  const res = await fetch(`${MEDUSA_BACKEND_URL}${path}`, {
    ...init,
    headers: {
      // Let fetch generate the multipart boundary for file uploads.
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  // An expired or revoked token means the session is dead — drop it and bounce
  // to login rather than surfacing a confusing error deep in a screen.
  if (res.status === 401) {
    await clearSession();
    redirect("/login");
  }

  if (!res.ok) {
    let detail: string | undefined;
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.trim()) {
        detail = body.message.trim();
      }
    } catch {
      /* non-JSON error body — the status alone will do */
    }
    throw new AdminApiError(
      `Admin API ${init.method ?? "GET"} ${path} failed (${res.status})${
        detail ? `: ${detail}` : ""
      }`,
      res.status,
      detail,
    );
  }

  return (await res.json()) as T;
}
