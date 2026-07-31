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

export async function getInventory(
  start?: string,
  end?: string,
): Promise<InventoryPayload> {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const qs = params.toString();
  return adminFetch<InventoryPayload>(
    `/admin/pg/inventory${qs ? `?${qs}` : ""}`,
  );
}
