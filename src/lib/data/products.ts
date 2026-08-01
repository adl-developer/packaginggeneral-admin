import { adminFetch } from "@/lib/medusa-admin";

/**
 * Products read seam — Settings → Products tab (read-only).
 *
 * Unlike every other wired screen this does NOT go through a custom
 * `admin/pg/*` route — Medusa's own `GET /admin/products` already serves the
 * catalog, so there is nothing bespoke to add on the backend.
 *
 * `starts_at` and `pricing_placeholder` are read off product `metadata`,
 * exactly as `backend/src/scripts/import-catalog.ts` writes them (confirmed
 * against that script 2026-08-01):
 *   - `starts_at`: the lowest variant `basePrice` at import time, in MAJOR
 *     currency units (matches `formatCedis`) — a "starting from" figure, not
 *     a true single base price (variants can differ).
 *   - `pricing_placeholder`: `true` on every product in the current catalog
 *     — the client's sheets arrived without real pricing. This flag MUST
 *     ride along so the UI never presents a placeholder figure as final.
 *
 * ⚠ SCOPED TO PUBLISHED PRODUCTS, deliberately. `GET /admin/pg/dashboard`
 * counts `filters: { status: "published" }` for its "Active Products" stat;
 * this call previously had no status filter at all, so drafts counted here
 * and not there and the two screens would state different catalog sizes with
 * nothing on either explaining the gap. Published is the side that was made
 * to match, not the other way round: this portal has no draft workflow (the
 * ProductCreator is deliberately disabled — see product-creator.tsx), so a
 * draft row would be a product staff can neither act on nor account for.
 * If drafts ever become actionable here, label the count on BOTH screens
 * rather than silently widening one.
 *
 * No mock path: a catalog screen showing invented numbers is worse than one
 * showing an error, because staff act on it.
 */

type MedusaProductCategory = {
  id: string;
  name: string;
};

type MedusaProductVariant = {
  id: string;
};

type MedusaProduct = {
  id: string;
  title: string;
  thumbnail: string | null;
  metadata: Record<string, unknown> | null;
  categories?: MedusaProductCategory[] | null;
  variants?: MedusaProductVariant[] | null;
};

type MedusaProductListResponse = {
  products: MedusaProduct[];
  count: number;
  offset: number;
  limit: number;
};

export type ProductRow = {
  id: string;
  title: string;
  thumbnail: string | null;
  /** First category name, or null when the product has none. */
  category: string | null;
  variantCount: number;
  /** "Starting from" price in major units (see header comment), or null when
   *  the product's metadata never set one. */
  startsAt: number | null;
  /** The store's only configured currency (root CLAUDE.md: "Currency is
   *  GHS") — Medusa does not carry a single currency on the product itself
   *  (prices are per-variant, multi-currency-capable), so this is not read
   *  off the API response; it is the fixed store configuration. */
  currencyCode: string;
  /** True on every product today — see header comment. Never render
   *  `startsAt` as a final price when this is true. */
  pricingPlaceholder: boolean;
};

export type ProductsPayload = {
  products: ProductRow[];
  /** PUBLISHED products only — same scope as the Overview stat card. */
  count: number;
  /** True when the catalog has more products than this page fetched
   *  (`limit=100`) — the current catalog is ~11 products, so this should
   *  stay false, but it must never silently under-report a bigger one. */
  truncated: boolean;
};

const STORE_CURRENCY_CODE = "GHS";

function toProductRow(p: MedusaProduct): ProductRow {
  const metadata = p.metadata ?? {};
  const startsAtRaw = metadata.starts_at;

  return {
    id: p.id,
    title: p.title,
    thumbnail: p.thumbnail ?? null,
    category: p.categories?.[0]?.name ?? null,
    variantCount: p.variants?.length ?? 0,
    startsAt: typeof startsAtRaw === "number" ? startsAtRaw : null,
    currencyCode: STORE_CURRENCY_CODE,
    pricingPlaceholder: metadata.pricing_placeholder === true,
  };
}

export async function getProducts(): Promise<ProductsPayload> {
  // `status` is an ARRAY param on Medusa's admin product list validator
  // (`AdminGetProductsParams.status: z.array(ProductStatus)`), hence the
  // `status[]=` form — a bare `status=published` is rejected.
  const res = await adminFetch<MedusaProductListResponse>(
    "/admin/products?limit=100&status[]=published&fields=id,title,thumbnail,metadata,*categories,*variants",
  );

  return {
    products: res.products.map(toProductRow),
    count: res.count,
    truncated: res.count > res.products.length,
  };
}
