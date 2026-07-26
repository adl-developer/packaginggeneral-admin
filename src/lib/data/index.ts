/**
 * The data facade — the ONE place screens read from.
 *
 * Today every function resolves mock fixtures. When we wire the Medusa Admin
 * API, replace the bodies here (and the mutations in `../store.tsx`) with
 * `sdk.admin.*` calls; no screen should need to change.
 *
 * Mapping notes for that migration:
 *   listOrders      -> sdk.admin.order.list({ fields, limit, offset })
 *   listCustomers   -> sdk.admin.customer.list()
 *   listProducts    -> sdk.admin.product.list()
 *   listTeam        -> sdk.admin.user.list()
 *   listPromoCodes  -> sdk.admin.promotion.list()
 *   getBanner / getSettings / claim / advance -> custom order-ops module routes
 *     in the backend (see backend/src/modules/order-ops) — these have no stock
 *     Medusa equivalent.
 */
import {
  ACTIVE_PRODUCT_COUNT,
  CURRENT_USER_ID,
  CUSTOMERS,
  ORDERS,
  PLATFORM_SETTINGS,
  PRODUCT_CATEGORY_COUNT,
  PRODUCTS,
  PROMO_BANNER,
  PROMO_CODES,
  TEAM,
  TOTAL_ORDERS_ALL_TIME,
} from "./mock";
import type { Order, OrderStatus, TeamMember } from "./types";

export * from "./types";
export {
  ACTIVE_PRODUCT_COUNT,
  CURRENT_USER_ID,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_COUNT,
  TOTAL_ORDERS_ALL_TIME,
} from "./mock";

export const listOrders = async (): Promise<Order[]> => ORDERS;
export const listCustomers = async () => CUSTOMERS;
export const listProducts = async () => PRODUCTS;
export const listTeam = async (): Promise<TeamMember[]> => TEAM;
export const listPromoCodes = async () => PROMO_CODES;
export const getBanner = async () => PROMO_BANNER;
export const getSettings = async () => PLATFORM_SETTINGS;

/** Counts behind the Overview stat cards. */
export function summarize(orders: Order[]) {
  const by = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  return {
    totalOrders: orders.length,
    newOrders: by("new"),
    inProgress: by("in-progress"),
    activeProducts: ACTIVE_PRODUCT_COUNT,
    categories: PRODUCT_CATEGORY_COUNT,
    /*
      Cancelled orders are EXCLUDED from revenue (client decision, 2026-07-25).

      ⚠ This intentionally diverges from the Figma mock, which shows
      GH₵ 83,869.42 — the sum of all 14 sample orders including the two
      cancelled ones. Excluding them gives GH₵ 79,178.23, which is what the
      Overview now renders. Do not "fix" this back to match the design.
    */
    revenue: orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0),
    allTime: TOTAL_ORDERS_ALL_TIME,
  };
}

/** Status → count map for the chips above the Orders table. */
export function statusCounts(orders: Order[]): Record<OrderStatus, number> {
  return {
    new: orders.filter((o) => o.status === "new").length,
    "in-progress": orders.filter((o) => o.status === "in-progress").length,
    ready: orders.filter((o) => o.status === "ready").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };
}

export const currentUser = () =>
  TEAM.find((m) => m.id === CURRENT_USER_ID) ?? TEAM[0];
