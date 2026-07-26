import { cookies } from "next/headers";
import {
  DEMO_TOKEN,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  isDemoMode,
} from "./config";

/**
 * Session helpers. Server-only by construction — `next/headers` throws if these
 * are ever pulled into a Client Component.
 *
 * The Medusa admin JWT lives ONLY in this httpOnly cookie. It is never sent to
 * the browser as JS-readable state, never put in localStorage, and never
 * embedded in a page payload.
 */

export async function setSession(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Secure everywhere except local http development.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/** True when the caller holds any valid session (demo or real). */
export async function isSignedIn() {
  return Boolean(await getSessionToken());
}

/**
 * The bearer token for Medusa calls, or null in demo mode (where there is no
 * backend to call).
 */
export async function getBearerToken(): Promise<string | null> {
  const token = await getSessionToken();
  if (!token) return null;
  if (isDemoMode() && token === DEMO_TOKEN) return null;
  return token;
}
