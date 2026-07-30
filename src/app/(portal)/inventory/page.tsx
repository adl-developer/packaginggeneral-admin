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
  } catch {
    return { ok: false };
  }
}

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
