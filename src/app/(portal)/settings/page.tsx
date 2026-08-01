import { unstable_rethrow } from "next/navigation";
import { SettingsScreen } from "@/components/settings/settings-screen";
import { PLATFORM_SETTINGS } from "@/lib/data/mock";
import { getProducts, type ProductsPayload } from "@/lib/data/products";

/** Live Medusa data — never cache. */
export const dynamic = "force-dynamic";

/**
 * Isolated from the returned JSX on purpose, same reasoning as
 * `inventory/page.tsx`'s `loadInventory`: eslint's react-hooks rule
 * (correctly) flags constructing JSX inside a try/catch, since React doesn't
 * render synchronously and the catch would never see a render error anyway.
 */
async function loadProducts(): Promise<
  { ok: true; payload: ProductsPayload } | { ok: false }
> {
  try {
    const payload = await getProducts();
    return { ok: true, payload };
  } catch (err) {
    // adminFetch redirects to /login by THROWING a Next.js control-flow
    // error when the session cookie is missing/expired (see
    // lib/medusa-admin.ts, mirrored by the same rule in every other wired
    // screen's load helper). That must propagate — swallowing it here would
    // tell an operator "backend unreachable" when their session just died.
    unstable_rethrow(err);
    // GET /admin/products takes no operator-supplied query params here, so
    // — same as Customers/Users/Overview — there is no "operator's own bad
    // URL" case to distinguish; anything else here is a real unreachable
    // backend.
    return { ok: false };
  }
}

/**
 * Settings — Figma 3834:15852. Product Management is wired to Medusa's own
 * `GET /admin/products` (Task 17). Platform Settings stays on fixtures — see
 * `components/settings/settings-screen.tsx` for the "not connected"
 * labelling that keeps that fact visible to whoever opens the tab.
 */
export default async function SettingsPage() {
  const productsResult = await loadProducts();

  return (
    <SettingsScreen
      productsResult={productsResult}
      platformSettings={PLATFORM_SETTINGS}
    />
  );
}
