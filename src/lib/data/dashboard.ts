import { adminFetch } from "@/lib/medusa-admin";
import type { OrderStage } from "@/lib/stage-mapping";

/**
 * Dashboard read seam. Mirrors the backend payload from
 * `GET /admin/pg/dashboard` — keep these types in step with
 * `backend/src/api/admin/pg/dashboard/route.ts`.
 *
 * No mock path: an Overview screen showing invented numbers is worse than
 * one showing an error, because staff act on it.
 */

export type DashboardStats = {
  total_orders: number;
  new_orders: number;
  in_progress: number;
  active_products: number;
  product_categories: number;
  /**
   * ⚠ total_revenue EXCLUDES cancelled orders (client decision 2026-07-25), so
   * it deliberately differs from the Figma mock's GH₵ 83,869.42, which summed
   * the cancelled ones too. Do not "fix" it back to match the design.
   */
  total_revenue: number;
  currency_code: string;
  /** True when the backend's order scan (REVENUE_SCAN_CAP orders, see
   *  route.ts) hit its cap — total_orders/total_revenue may be an undercount,
   *  not a wrong-but-complete total. Optional so this still typechecks
   *  against an older backend response that never sends it. */
  sampled?: boolean;
};

/** Same five order-ops stages the Orders screen uses — see `stage-mapping.ts`. */
export type DashboardStages = Record<OrderStage, number>;

export type DashboardRecentOrder = {
  id: string;
  display_id: number;
  order_number: string;
  created_at: string;
  total: number;
  currency_code: string;
  /** Native Medusa order status (e.g. "pending", "completed") — distinct
   *  from `stage`, the order-ops fulfilment stage. */
  status: string;
  stage: OrderStage;
  first_item_title: string | null;
  total_quantity: number;
};

export type DashboardPayload = {
  stats: DashboardStats;
  stages: DashboardStages;
  recent_orders: DashboardRecentOrder[];
};

export async function getDashboard(): Promise<DashboardPayload> {
  return adminFetch<DashboardPayload>("/admin/pg/dashboard");
}
