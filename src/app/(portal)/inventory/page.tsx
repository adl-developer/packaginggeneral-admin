import { unstable_rethrow } from "next/navigation";
import { getInventory, type InventoryPayload } from "@/lib/data/inventory";
import { InventoryScreen } from "@/components/inventory/inventory-screen";

/** Live Medusa data — never cache. */
export const dynamic = "force-dynamic";

/**
 * Isolated from the returned JSX on purpose: eslint's react-hooks rule
 * (correctly) flags constructing JSX inside a try/catch, since React doesn't
 * render synchronously and the catch would never see a render error anyway.
 * Keeping the try/catch in a plain async function and branching on its
 * result afterwards gets the same fail-visible behaviour without that trap.
 */
async function loadInventory(): Promise<
  { ok: true; payload: InventoryPayload } | { ok: false }
> {
  try {
    const payload = await getInventory();
    return { ok: true, payload };
  } catch (err) {
    // adminFetch redirects to /login by THROWING a Next.js control-flow
    // error when the session cookie is missing/expired (see
    // lib/medusa-admin.ts, mirrored by the same rule in
    // lib/actions/run.ts). That must propagate — swallowing it here would
    // tell an operator "backend unreachable" when their session just died.
    unstable_rethrow(err);
    return { ok: false };
  }
}

/**
 * ⚠ This page took a date range until 2026-08-02 (`?start=&end=&range=`, with
 * a redirect to a default Last 30d window). The client asked for the date bar
 * and the "Ordered in range" column it scoped to be removed, and the two only
 * ever made sense together — so the URL carries no scope any more and every
 * load shows the same current stock position.
 *
 * The old "invalid date range" failure branch went with them: it existed for a
 * hand-edited `?start=notadate`, and this page no longer sends start or end,
 * so the backend's 400 for a malformed date is unreachable from here. A
 * failure is a failure again — one panel.
 */
export default async function InventoryPage() {
  const result = await loadInventory();

  if (!result.ok) {
    // An inventory screen that renders zeros on failure would read as "no
    // stock" — the most dangerous possible lie here. Fail visibly instead.
    return (
      <div className="rounded-panel border border-line bg-surface p-8 text-center">
        <p className="text-base font-semibold text-brand">
          Inventory is unavailable
        </p>
        <p className="mt-1 text-sm text-muted">
          Could not reach the commerce backend. Stock figures are deliberately
          not shown rather than guessed. Reload once the backend is reachable.
        </p>
      </div>
    );
  }

  return <InventoryScreen payload={result.payload} />;
}
