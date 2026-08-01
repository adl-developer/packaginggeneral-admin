/**
 * The data facade — legacy seam, now scoped to the two screens still on
 * fixtures.
 *
 * Every other screen (Overview, Orders, Customers, Users, Inventory, and as
 * of Task 17, Settings → Products) reads live Medusa data through its own
 * module in `lib/data/` — see `dashboard.ts`, `orders.ts`, `customers.ts`,
 * `users.ts`, `inventory.ts`, `products.ts`. This file no longer sits in
 * front of them; `listOrders`, `listCustomers`, `listProducts`, `listTeam`,
 * `summarize`, `statusCounts` and `currentUser` were deleted here because
 * their screens are live and nothing imported them any more.
 *
 * What remains reads fixtures for the two screens that are **not** wired,
 * both scoped to a follow-up spec rather than this plan:
 *   - **Promotions** — needs discount fields the current Figma design lacks.
 *   - **Settings → Platform tab** — VAT/NHIL/GETFund/fees have no backend
 *     persistence at all yet.
 *
 * Both screens actually hold their fixture data as local component state
 * (`useState` seeded from `./mock` directly, since they're client
 * components mutating in place) rather than calling the wrappers below, so
 * these are currently unused by any screen — kept as the documented shape a
 * real Medusa-backed read would take once that follow-up spec lands:
 *   listPromoCodes -> sdk.admin.promotion.list() / campaign.list()
 *   getBanner / getSettings -> a settings-persistence route the backend
 *     does not have yet
 */
import { PLATFORM_SETTINGS, PROMO_BANNER, PROMO_CODES } from "./mock";

export * from "./types";

export const listPromoCodes = async () => PROMO_CODES;
export const getBanner = async () => PROMO_BANNER;
export const getSettings = async () => PLATFORM_SETTINGS;
