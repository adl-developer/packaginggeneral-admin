import { unstable_rethrow } from "next/navigation";
import { SettingsScreen } from "@/components/settings/settings-screen";
import { getPlatformSettings, type PlatformPayload } from "@/lib/data/platform";
import { getProductCategories } from "@/lib/data/product-form";
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
 * The category list the product form offers. Degrades to an EMPTY list rather
 * than taking the page down: the form is one control on this screen, and the
 * product list beside it is still readable without it. An empty list makes
 * "Create Product" honestly unusable (a product must have a category) instead
 * of offering invented options — which is what the old hardcoded
 * `PRODUCT_CATEGORIES` fixture did, listing slugs like "tape" and
 * "bubble-wrap" that are not categories in this store at all.
 */
async function loadCategories(): Promise<string[]> {
  try {
    return await getProductCategories();
  } catch (err) {
    // Same dead-session rule as loadProducts above.
    unstable_rethrow(err);
    return [];
  }
}

/**
 * Tax settings load independently of the product list: either half can fail
 * without blanking the other, and each renders its own failure panel. A tax
 * rate is never guessed from a default — see the panel in `settings-screen`.
 */
async function loadPlatform(): Promise<
  { ok: true; payload: PlatformPayload } | { ok: false }
> {
  try {
    return { ok: true, payload: await getPlatformSettings() };
  } catch (err) {
    // Same dead-session rule as loadProducts above.
    unstable_rethrow(err);
    return { ok: false };
  }
}

/**
 * Settings — Figma 3834:15852. Both halves are live as of 2026-08-02: Product
 * Management on Medusa's `GET /admin/products` plus `/admin/pg/products` for
 * create/edit/delete, and Platform Settings on
 * `/admin/pg/settings/platform`. No fixtures remain on this screen.
 */
export default async function SettingsPage() {
  const [productsResult, categories, platformResult] = await Promise.all([
    loadProducts(),
    loadCategories(),
    loadPlatform(),
  ]);

  return (
    <SettingsScreen
      productsResult={productsResult}
      categories={categories}
      platformResult={platformResult}
    />
  );
}
