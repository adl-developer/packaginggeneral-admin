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
 * ⚠ ALL STATUSES, as of 2026-08-02 — this was published-only until the
 * ProductCreator became real. Drafts are now actionable (staff create and
 * edit them here), so hiding them would hide products that exist.
 *
 * The old comment here demanded that widening this be LABELLED rather than
 * silent, because `GET /admin/pg/dashboard` counts
 * `filters: { status: "published" }` for its "Active Products" stat and two
 * screens quietly stating different catalog sizes is the bug that rule
 * exists to prevent. So: `count` below is the TOTAL, `draft_count` is carried
 * alongside it, and the Settings header names both. Overview's card still
 * says "Active Products" and still counts published — the two now disagree
 * visibly and for a stated reason, which is the point.
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
  status?: string | null;
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

/** Medusa's product statuses. `proposed` and `rejected` exist in the enum but
 *  nothing in this project produces them; they are carried through rather than
 *  collapsed into "draft" so an unexpected one is visible instead of
 *  mislabelled. */
export type ProductStatus = "draft" | "published" | "proposed" | "rejected";

export type ProductRow = {
  id: string;
  title: string;
  status: ProductStatus;
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
  /** EVERY status. Deliberately NOT the same scope as Overview's "Active
   *  Products" card, which counts published only — see the header note. */
  count: number;
  /** How many of `count` are drafts. Lets the header say so out loud instead
   *  of leaving the gap with Overview unexplained. */
  draftCount: number;
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
    status: (p.status as ProductStatus) ?? "draft",
    thumbnail: p.thumbnail ?? null,
    category: p.categories?.[0]?.name ?? null,
    variantCount: p.variants?.length ?? 0,
    startsAt: typeof startsAtRaw === "number" ? startsAtRaw : null,
    currencyCode: STORE_CURRENCY_CODE,
    pricingPlaceholder: metadata.pricing_placeholder === true,
  };
}

export async function getProducts(): Promise<ProductsPayload> {
  // No `status[]=` filter: every status. (When one IS wanted, note that
  // Medusa's admin list validator types it as an ARRAY —
  // `AdminGetProductsParams.status: z.array(ProductStatus)` — so it must be
  // sent as `status[]=published`; a bare `status=published` is rejected.)
  const res = await adminFetch<MedusaProductListResponse>(
    "/admin/products?limit=100&fields=id,title,status,thumbnail,metadata,*categories,*variants",
  );

  const products = res.products.map(toProductRow);

  return {
    products,
    count: res.count,
    // Counted from the fetched rows, not the API — Medusa returns no
    // per-status breakdown, and a second round trip for a number this small
    // isn't worth it. Under truncation it under-reports, which is why the
    // header only shows it alongside the truncation note.
    draftCount: products.filter((p) => p.status === "draft").length,
    truncated: res.count > res.products.length,
  };
}
