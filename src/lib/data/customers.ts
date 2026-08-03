import { adminFetch } from "@/lib/medusa-admin";
import type { OrderStage } from "@/lib/stage-mapping";

/**
 * Customers read seam. Mirrors the backend payloads from
 * `GET /admin/pg/customers` and `GET /admin/pg/customers/:id` — keep these
 * types in step with `backend/src/api/admin/pg/customers/route.ts` and
 * `backend/src/api/admin/pg/customers/[id]/route.ts`.
 *
 * Those routes exist (rather than reading `GET /admin/customers` directly)
 * because that endpoint's field allowlist has no `orders` field to request —
 * see the header comment on the backend list route for the full reasoning
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
  /** False for a customer record created by a guest checkout, true once that
   *  person registers. Drives the Account column. */
  has_account: boolean;
  orders: number;
};

export type CustomersPayload = {
  customers: CustomerRow[];
  total_customers: number;
  /** How many of `total_customers` have a real account — the rest reached
   *  the list through guest checkout. Whole-dataset, not a tally over the
   *  returned page. */
  registered_customers: number;
  /** True when more customers exist than this page returned. */
  truncated: boolean;
  /** True when the order-count scan behind `orders` hit its cap — counts on
   *  this page may be undercounts, not wrong-but-complete totals. */
  counts_sampled: boolean;
};

export type CustomerAddress = {
  id: string;
  address_name: string | null;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country_code: string | null;
  phone: string | null;
  is_default_shipping: boolean;
  is_default_billing: boolean;
};

/** One row of the customer's order history. A leaner shape than the Orders
 *  screen's `OrderListRow` — no assignment, since this list answers "what has
 *  this person bought", not "who is working on it". */
export type CustomerOrderRow = {
  id: string;
  display_id: number;
  order_number: string;
  created_at: string;
  total: number;
  currency_code: string;
  native_status: string;
  email: string | null;
  stage: OrderStage;
  first_item_title: string | null;
  first_item_variant: string | null;
  items_count: number;
  total_quantity: number;
};

export type CustomerStats = {
  /** Cancelled orders excluded, matching the list screen's Orders column. */
  orders: number;
  cancelled_orders: number;
  lifetime_spend: number;
  first_order_at: string | null;
  last_order_at: string | null;
  /** Null when the customer has never ordered — never defaulted to GHS. */
  currency_code: string | null;
};

export type CustomerDetail = {
  customer: {
    id: string;
    name: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    has_account: boolean;
    created_at: string;
    updated_at: string;
    metadata: Record<string, unknown> | null;
    addresses: CustomerAddress[];
  };
  stats: CustomerStats;
  /** Newest first, capped by the backend's scan — see `orders_truncated`. */
  orders: CustomerOrderRow[];
  /** True when the customer has more orders than the backend scanned: the
   *  history is one page AND `stats` is a floor, not a lifetime total. */
  orders_truncated: boolean;
};

/**
 * `start`/`end` are `YYYY-MM-DD` and scope the list to customers CREATED in
 * that window — everything in the payload (rows, `total_customers`,
 * `registered_customers`, `truncated`) then describes that window.
 *
 * ⚠ The `orders` count on each row stays a LIFETIME total either way — the
 * backend deliberately doesn't scope it, so a screen showing it under an
 * active range must say so. See the backend route's header.
 */
export async function getCustomers(params?: {
  start?: string;
  end?: string;
}): Promise<CustomersPayload> {
  const qs = new URLSearchParams();
  if (params?.start) qs.set("start", params.start);
  if (params?.end) qs.set("end", params.end);
  const s = qs.toString();
  return adminFetch<CustomersPayload>(
    `/admin/pg/customers${s ? `?${s}` : ""}`,
  );
}

export async function getCustomerDetail(
  id: string,
): Promise<CustomerDetail> {
  return adminFetch<CustomerDetail>(
    `/admin/pg/customers/${encodeURIComponent(id)}`,
  );
}
