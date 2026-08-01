import { adminFetch } from "@/lib/medusa-admin";
import type { OrderStage } from "@/lib/stage-mapping";

/**
 * Orders read seam. Mirrors `GET /admin/pg/orders-ops` and
 * `GET /admin/pg/orders/:id` — keep in step with
 * `backend/src/api/admin/pg/orders-ops/route.ts` and
 * `backend/src/api/admin/pg/orders/[id]/route.ts`.
 *
 * No mock path: an operations screen showing invented numbers is worse than
 * one showing an error, because staff act on it.
 */

export type OrderListRow = {
  id: string;
  display_id: number;
  order_number: string;
  created_at: string;
  total: number;
  currency_code: string;
  native_status: string;
  email: string | null;
  stage: OrderStage;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  first_item_title: string | null;
  first_item_variant: string | null;
  items_count: number;
  total_quantity: number;
};

export type OrdersListPayload = {
  orders: OrderListRow[];
  count: number;
  total_orders: number;
  stage_counts: Record<OrderStage, number>;
  truncated: boolean;
};

export type OrderDetailCustomization = {
  size: string | null;
  material: string | null;
  printing: string | null;
  /** The flat variant title, set ONLY when labelled options are unavailable. */
  fallback: string | null;
};

export type OrderDetailTaxLine = {
  description: string | null;
  rate: number;
  code: string | null;
};

export type OrderDetailAdjustment = {
  amount: number;
  code: string | null;
};

export type OrderDetailItem = {
  id: string;
  title: string | null;
  variant_title: string | null;
  sku: string | null;
  thumbnail: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  customization: OrderDetailCustomization;
  tax_lines: OrderDetailTaxLine[];
  adjustments: OrderDetailAdjustment[];
};

/** Mirrors Medusa's `OrderAddressDTO` — only the fields the route selects
 *  with `shipping_address.*` / `billing_address.*`. */
export type OrderDetailAddress = {
  id: string;
  customer_id?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  country_code?: string;
  province?: string;
  postal_code?: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type OrderDetailShippingMethod = {
  id: string;
  name: string;
  amount: number;
};

export type OrderDetailCustomer = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  has_account: boolean;
};

export type OrderDetailTotals = {
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  discount_total: number;
  total: number;
  paid_total: number;
  refunded_total: number;
  pending_difference: number;
};

export type OrderDetailPayment = {
  status: string | null;
  provider: string | null;
  authorized: number;
  captured: number;
  refunded: number;
  channel: string | null;
  reference: string | null;
  transaction_id: string | null;
  paid_at: string | null;
  /** Paystack's fee in MAJOR units. */
  fee: number | null;
  mode: "test" | "live" | null;
};

export type OrderDetailFulfillment = {
  id: string;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  canceled_at: string | null;
};

export type OrderDetailAssignment = {
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  claimed_at: string | null;
};

/** `type: "note"` activities are the order's staff notes — there is no
 *  separate notes array on the response. */
export type OrderDetailActivity = {
  id: string;
  type: string;
  actor_name: string;
  detail: string | null;
  created_at: string;
};

export type OrderDetail = {
  id: string;
  order_number: string;
  display_id: number;
  native_status: string;
  stage: OrderStage;
  created_at: string;
  updated_at: string;
  canceled_at: string | null;
  currency_code: string;
  email: string | null;
  is_draft_order: boolean;
  region_id: string | null;
  sales_channel_id: string | null;
  metadata: Record<string, unknown> | null;
  items: OrderDetailItem[];
  shipping_address: OrderDetailAddress | null;
  billing_address: OrderDetailAddress | null;
  shipping_methods: OrderDetailShippingMethod[];
  customer: OrderDetailCustomer | null;
  totals: OrderDetailTotals;
  payment: OrderDetailPayment | null;
  payment_collection_id: string | null;
  payment_id: string | null;
  fulfillments: OrderDetailFulfillment[];
  assignment: OrderDetailAssignment;
  activities: OrderDetailActivity[];
};

export async function getOrders(params: {
  stage?: string;
  worker?: string;
  q?: string;
}): Promise<OrdersListPayload> {
  const qs = new URLSearchParams();
  if (params.stage) qs.set("stage", params.stage);
  if (params.worker) qs.set("worker", params.worker);
  if (params.q) qs.set("q", params.q);
  const s = qs.toString();
  return adminFetch<OrdersListPayload>(
    `/admin/pg/orders-ops${s ? `?${s}` : ""}`,
  );
}

export async function getOrderDetail(id: string): Promise<OrderDetail> {
  return adminFetch<OrderDetail>(
    `/admin/pg/orders/${encodeURIComponent(id)}`,
  );
}
