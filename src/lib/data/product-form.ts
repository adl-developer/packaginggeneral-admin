import { adminFetch } from "@/lib/medusa-admin";

/**
 * Read seam for the product create/edit form.
 *
 * Types mirror `backend/src/api/admin/pg/products/product-form.ts` — keep them
 * in step. That module owns the metadata contract the storefront depends on;
 * this side only collects what the operator types.
 */

export type LengthUnit = "mm" | "cm" | "m";

export type SizeInput = {
  value: string;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  unit?: LengthUnit;
};

export type MaterialInput = { value: string; description?: string };

export type PrintInput = {
  value: string;
  description?: string;
  setupFee?: number;
  perUnit?: number;
};

export type VariantInput = {
  size: string;
  material?: string | null;
  printing?: string | null;
  sku: string;
  /** GHS, major units. */
  price: number;
};

export type ProductFormPayload = {
  title: string;
  handle?: string;
  description?: string;
  category: string;
  status?: "draft" | "published";
  moq?: number;
  weight?: number;
  features?: string[];
  optionLabels?: { size?: string; material?: string };
  sizes: SizeInput[];
  materials?: MaterialInput[];
  prints?: PrintInput[];
  variants: VariantInput[];
};

/** What `GET /admin/pg/products/:id` returns — the payload above plus the ids
 *  the update route needs to match rows back up. */
export type LoadedProductForm = ProductFormPayload & {
  id: string;
  variantIds: Record<string, string>;
};

export async function getProductForm(id: string): Promise<LoadedProductForm> {
  return adminFetch<LoadedProductForm>(`/admin/pg/products/${id}`);
}

type CategoryListResponse = {
  product_categories: { id: string; name: string }[];
};

/**
 * Real categories, replacing the hardcoded `PRODUCT_CATEGORIES` fixture the
 * form used to offer. That list contained slugs ("tape", "bubble-wrap") that
 * are not categories in this store at all, so picking one would have created a
 * product filed under a category the storefront's browse never shows.
 *
 * Medusa's own route — nothing bespoke to add, same reasoning as `products.ts`.
 */
export async function getProductCategories(): Promise<string[]> {
  const res = await adminFetch<CategoryListResponse>(
    "/admin/product-categories?limit=100&fields=id,name",
  );
  return res.product_categories.map((c) => c.name).sort();
}
