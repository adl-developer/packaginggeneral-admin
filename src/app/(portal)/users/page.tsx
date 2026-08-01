import { unstable_rethrow } from "next/navigation";
import { UsersScreen } from "@/components/users/users-screen";
import { getTeam, type UsersPayload } from "@/lib/data/users";

/** Live Medusa data — never cache. */
export const dynamic = "force-dynamic";

/**
 * Isolated from the returned JSX on purpose, same reasoning as
 * `inventory/page.tsx`'s `loadInventory`: eslint's react-hooks rule
 * (correctly) flags constructing JSX inside a try/catch, since React doesn't
 * render synchronously and the catch would never see a render error anyway.
 */
async function loadTeam(): Promise<
  { ok: true; payload: UsersPayload } | { ok: false }
> {
  try {
    const payload = await getTeam();
    return { ok: true, payload };
  } catch (err) {
    // adminFetch redirects to /login by THROWING a Next.js control-flow
    // error when the session cookie is missing/expired (see
    // lib/medusa-admin.ts, mirrored by the same rule in every other wired
    // screen's load helper). That must propagate — swallowing it here would
    // tell an operator "backend unreachable" when their session just died.
    unstable_rethrow(err);
    // GET /admin/pg/users takes no query params, so — same as Customers and
    // Overview — there is no "operator's own bad URL" case to distinguish;
    // anything else here is a real unreachable backend.
    return { ok: false };
  }
}

/**
 * Team Members — Figma 3803:3429, wired to `GET /admin/pg/users`.
 *
 * ⚠ The Users tab is hidden from non-super-admins in `portal-tabs.tsx` for
 * usability only. Anyone who reaches this URL directly still gets the real
 * roster here (`GET /admin/pg/users` has no role gate of its own) — the
 * actual permission boundary is on the mutation routes
 * (`PATCH .../role`, `POST .../invites`), which 403 for a non-super-admin
 * caller. See `users-screen.tsx` for how that refusal surfaces.
 */
export default async function UsersPage() {
  const result = await loadTeam();

  if (!result.ok) {
    // Never render an empty table on failure — "no users" and "we couldn't
    // load users" must not look the same, and a screen showing zero staff
    // during an outage reads as nobody having access.
    return (
      <div className="rounded-panel border border-line bg-surface p-8 text-center">
        <p className="text-base font-semibold text-brand">
          Users are unavailable
        </p>
        <p className="mt-1 text-sm text-muted">
          Could not reach the commerce backend. The user roster is
          deliberately not shown rather than guessed. Reload once the
          backend is reachable.
        </p>
      </div>
    );
  }

  return <UsersScreen payload={result.payload} />;
}
