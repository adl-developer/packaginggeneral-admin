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
 * Not yet used by any screen: the portal still reads mock fixtures via
 * `lib/data/`. This is the plumbing those functions will call once wiring
 * begins, so the auth work is complete and testable ahead of that.
 */

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
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
      "Content-Type": "application/json",
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
    let detail = "";
    try {
      const body = (await res.json()) as { message?: string };
      detail = body.message ? `: ${body.message}` : "";
    } catch {
      /* non-JSON error body — the status alone will do */
    }
    throw new AdminApiError(
      `Admin API ${init.method ?? "GET"} ${path} failed (${res.status})${detail}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}
