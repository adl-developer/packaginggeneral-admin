/**
 * Auth configuration shared by the server actions and the proxy.
 *
 * Kept dependency-free so `src/proxy.ts` can import it (proxy runs before the
 * render pipeline and must not pull in app modules).
 */

export const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL ?? "";

/** httpOnly cookie holding the Medusa admin JWT. Never readable from JS. */
export const SESSION_COOKIE = "pg_admin_session";

/** 12 hours — short enough to limit exposure, long enough for a work day. */
export const SESSION_MAX_AGE = 60 * 60 * 12;

/**
 * Demo mode lets the portal run against the mock fixtures with no backend, so
 * the screens can be reviewed before wiring.
 *
 * It requires BOTH no configured backend AND a non-production build, so it can
 * never be switched on by a misconfigured production deploy — in production an
 * unset MEDUSA_BACKEND_URL fails closed (login errors) rather than opening up.
 */
export function isDemoMode() {
  return !MEDUSA_BACKEND_URL && process.env.NODE_ENV !== "production";
}

/** Marker stored instead of a real JWT while in demo mode. */
export const DEMO_TOKEN = "demo-session";
