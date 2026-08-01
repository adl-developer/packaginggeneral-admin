import { unstable_rethrow } from "next/navigation";
import { CustomersScreen } from "@/components/customers/customers-screen";
import { getCustomers, type CustomersPayload } from "@/lib/data/customers";

/** Live Medusa data — never cache. */
export const dynamic = "force-dynamic";

/**
 * Isolated from the returned JSX on purpose, same reasoning as
 * `inventory/page.tsx`'s `loadInventory`: eslint's react-hooks rule
 * (correctly) flags constructing JSX inside a try/catch, since React doesn't
 * render synchronously and the catch would never see a render error anyway.
 */
async function loadCustomers(): Promise<
  { ok: true; payload: CustomersPayload } | { ok: false }
> {
  try {
    const payload = await getCustomers();
    return { ok: true, payload };
  } catch (err) {
    // adminFetch redirects to /login by THROWING a Next.js control-flow
    // error when the session cookie is missing/expired (see
    // lib/medusa-admin.ts, mirrored by the same rule in every other wired
    // screen's load helper). That must propagate — swallowing it here would
    // tell an operator "backend unreachable" when their session just died.
    unstable_rethrow(err);
    // GET /admin/pg/customers takes no query params, so — same as the
    // Overview page — there is no "operator's own bad URL" case to
    // distinguish; anything else here is a real unreachable backend.
    return { ok: false };
  }
}

/** Customers — Figma 3847:20531, wired to `GET /admin/pg/customers`. */
export default async function CustomersPage() {
  const result = await loadCustomers();

  if (!result.ok) {
    // Never render an empty table on failure — "no customers" and "we
    // couldn't load customers" must not look the same, and a screen showing
    // zero customers during an outage reads as staff having no customers.
    return (
      <div className="rounded-panel border border-line bg-surface p-8 text-center">
        <p className="text-base font-semibold text-brand">
          Customers are unavailable
        </p>
        <p className="mt-1 text-sm text-muted">
          Could not reach the commerce backend. Customer figures are
          deliberately not shown rather than guessed. Reload once the
          backend is reachable.
        </p>
      </div>
    );
  }

  return <CustomersScreen payload={result.payload} />;
}
