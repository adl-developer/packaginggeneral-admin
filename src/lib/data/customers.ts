import { adminFetch } from "@/lib/medusa-admin";

/**
 * Customers read seam. Mirrors the backend payload from
 * `GET /admin/pg/customers` — keep these types in step with
 * `backend/src/api/admin/pg/customers/route.ts`.
 *
 * That route exists (rather than reading `GET /admin/customers` directly)
 * because that endpoint's field allowlist has no `orders` field to request —
 * see the header comment on the backend route for the full reasoning
 * (including why cancelled orders are excluded from the count). The order
 * count returned here is always a real, computed number; this module has no
 * mock path and must never default a missing count to zero.
 */
export type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  /** `null` when absent — the table renders an em dash for that. */
  company: string | null;
  orders: number;
};

export type CustomersPayload = {
  customers: CustomerRow[];
  total_customers: number;
  /** True when more customers exist than this page returned. */
  truncated: boolean;
  /** True when the order-count scan behind `orders` hit its cap — counts on
   *  this page may be undercounts, not wrong-but-complete totals. */
  counts_sampled: boolean;
};

export async function getCustomers(): Promise<CustomersPayload> {
  return adminFetch<CustomersPayload>("/admin/pg/customers");
}
