import { adminFetch } from "@/lib/medusa-admin";

/**
 * Inventory read seam. Mirrors the backend payload from
 * `GET /admin/pg/inventory` — keep these types in step with
 * `backend/src/api/admin/pg/inventory/aggregate.ts`.
 *
 * Unlike the other screens there is NO mock path: an inventory screen showing
 * invented numbers is worse than one showing an error, because staff would act
 * on it.
 */
export type StaffReservation = {
  id: string;
  quantity: number;
  reason: string | null;
  created_at: string | null;
};

export type VariantRow = {
  id: string;
  inventory_item_id: string;
  title: string;
  sku: string | null;
  total_stock: number;
  orders_used: number;
  reserved: number;
  available: number;
  ordered_in_range: number;
  threshold: number | null;
  in_alert: boolean;
  staff_reservations: StaffReservation[];
};

export type ProductRow = {
  id: string;
  title: string;
  category: string | null;
  total_stock: number;
  orders_used: number;
  reserved: number;
  available: number;
  ordered_in_range: number;
  threshold: number | null;
  threshold_mixed: boolean;
  in_alert: boolean;
  variants: VariantRow[];
};

export type InventoryPayload = {
  location_id: string;
  products: ProductRow[];
  stats: {
    products_tracked: number;
    total_stock: number;
    units_reserved: number;
    stock_alerts: number;
    /** True when the backend's order scan behind "Ordered in range" hit its
     *  cap (`ORDER_SCAN_CAP` in aggregate.ts) — the ordered figures may be an
     *  undercount, not a wrong-but-complete total. Optional so this still
     *  typechecks against an older backend response that never sends it. */
    sampled?: boolean;
  };
};

/**
 * ⚠ `ordered=none` is deliberate, and it is a PERFORMANCE guard, not a
 * cosmetic one.
 *
 * The "Ordered in range" column and its date bar were removed on 2026-08-02.
 * The figure behind them costs a scan of up to ORDER_SCAN_CAP (1,000) orders
 * with all their line items, on every single load of this screen. Simply
 * dropping the start/end params would have made that WORSE, not free: with no
 * window the same scan runs unfiltered, over the whole order history, for a
 * column nobody renders.
 *
 * So the seam tells the backend not to compute it at all. The route keeps
 * full support for start/end and still computes the figure for anyone who
 * asks — re-enabling the column is dropping this one param plus the UI, with
 * no backend change. See `backend/src/api/admin/pg/inventory/route.ts`.
 *
 * `ordered_in_range` is still present on the payload types below and reads 0
 * under this param. Do NOT render it without removing the param first: a
 * genuine zero and "not computed" would be indistinguishable.
 */
export async function getInventory(): Promise<InventoryPayload> {
  return adminFetch<InventoryPayload>("/admin/pg/inventory?ordered=none");
}
