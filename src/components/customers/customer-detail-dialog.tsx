"use client";

import * as React from "react";
import { AccountBadge } from "@/components/customers/account-badge";
import { StatusBadge } from "@/components/orders/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collapsible } from "@/components/ui/collapsible";
import { Dialog } from "@/components/ui/dialog";
import type {
  CustomerAddress,
  CustomerDetail,
  CustomerOrderRow,
} from "@/lib/data/customers";
import { stageToStatus } from "@/lib/stage-mapping";
import { formatCedis, formatDate } from "@/lib/utils";

/**
 * Customer Detail — opened by clicking a row on the Customers screen.
 *
 * There is no Figma frame for this dialog; it deliberately reuses the Order
 * Detail dialog's shape (720px, summary strip, collapsible sections, the same
 * `StatusBadge` for order stage) so the two read as one portal rather than two
 * conventions. Do not treat its absence from the design file as licence to
 * invent a different visual language for it.
 *
 * Read-only. The portal has no customer mutation endpoints, so this dialog has
 * no controls that would imply otherwise — the project's rule that a control
 * which looks functional but changes nothing is a defect, not a placeholder.
 */
export function CustomerDetailDialog({
  detail,
  open,
  onClose,
}: {
  detail: CustomerDetail;
  open: boolean;
  onClose: () => void;
}) {
  const { customer, stats, orders, orders_truncated: truncated } = detail;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={customer.name}
      description={customer.email ?? undefined}
      width={720}
    >
      <div className="mb-4 flex items-center gap-3">
        <Avatar name={customer.name} />
        <AccountBadge hasAccount={customer.has_account} />
        {customer.company && (
          <span className="truncate text-sm leading-5 text-muted">
            {customer.company}
          </span>
        )}
      </div>

      {/* Three-up summary strip, same as the Order Detail dialog. Figures are
          marked as a floor when the backend's order scan hit its cap — see
          `orders_truncated`. */}
      <div className="grid grid-cols-3 gap-4 rounded-card border border-line bg-[rgba(196,188,176,0.15)] p-4">
        <SummaryStat
          label="Orders"
          value={`${stats.orders.toLocaleString()}${truncated ? "+" : ""}`}
        />
        <SummaryStat
          label="Lifetime spend"
          value={`${formatCedis(stats.lifetime_spend)}${truncated ? "+" : ""}`}
        />
        <SummaryStat
          label="Last order"
          value={stats.last_order_at ? formatDate(stats.last_order_at) : "—"}
        />
      </div>

      <div className="mt-5">
        <Collapsible title="Contact" defaultOpen>
          <dl className="flex flex-col gap-2">
            <Field label="Name" value={customer.name} />
            <Field label="Email" value={customer.email ?? "—"} />
            <Field label="Phone" value={customer.phone ?? "—"} />
            <Field label="Company" value={customer.company ?? "—"} />
            <Field
              label="Account"
              value={
                customer.has_account ? "Registered account" : "Guest checkout"
              }
            />
            <Field label="Customer since" value={formatDate(customer.created_at)} />
            <Field
              label="First order"
              value={
                stats.first_order_at ? formatDate(stats.first_order_at) : "—"
              }
            />
            {stats.cancelled_orders > 0 && (
              // Only shown when non-zero: cancelled orders are excluded from
              // the Orders/spend figures above (the 2026-07-25 aggregate
              // rule), so an operator comparing this dialog against the order
              // history needs to see where the difference went.
              <Field
                label="Cancelled orders"
                value={stats.cancelled_orders.toLocaleString()}
              />
            )}
            <Field label="Customer ID" value={customer.id} />
          </dl>
        </Collapsible>

        <Collapsible
          title="Addresses"
          count={customer.addresses.length}
          summary={
            customer.addresses.length === 0 ? "No saved addresses" : undefined
          }
        >
          {customer.addresses.length === 0 ? (
            <p className="text-sm leading-5 text-muted">
              No saved addresses. A guest checkout stores its address on the
              order, not on the customer.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {customer.addresses.map((a) => (
                <AddressBlock key={a.id} address={a} />
              ))}
            </div>
          )}
        </Collapsible>

        <Collapsible
          title="Order history"
          count={orders.length}
          summary={orders.length === 0 ? "No orders" : undefined}
          defaultOpen
        >
          {orders.length === 0 ? (
            <p className="text-sm leading-5 text-muted">
              This customer has not placed an order yet.
            </p>
          ) : (
            <ul className="flex flex-col">
              {orders.map((order, i) => (
                <li
                  key={order.id}
                  className={
                    i === orders.length - 1
                      ? "py-3"
                      : "border-b border-line py-3"
                  }
                >
                  <OrderHistoryRow order={order} />
                </li>
              ))}
            </ul>
          )}

          {truncated && (
            <p className="pt-3 text-xs leading-4 text-muted">
              Only this customer&rsquo;s most recent orders are shown — the
              totals above are a floor, not a complete lifetime figure.
            </p>
          )}
        </Collapsible>
      </div>
    </Dialog>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs leading-4 text-muted">{label}</p>
      <p className="truncate text-sm leading-5 font-medium text-brand">
        {value}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="shrink-0 text-sm leading-5 text-muted">{label}</dt>
      <dd className="truncate text-sm leading-5 text-brand">{value}</dd>
    </div>
  );
}

function AddressBlock({ address }: { address: CustomerAddress }) {
  const lines = [
    [address.first_name, address.last_name].filter(Boolean).join(" "),
    address.company,
    [address.address_1, address.address_2].filter(Boolean).join(", "),
    [address.city, address.province, address.postal_code]
      .filter(Boolean)
      .join(", "),
    address.country_code?.toUpperCase() ?? null,
    address.phone,
  ].filter((line): line is string => Boolean(line));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm leading-5 font-medium text-brand">
          {address.address_name ?? "Address"}
        </p>
        {address.is_default_shipping && <Badge>Default shipping</Badge>}
        {address.is_default_billing && <Badge>Default billing</Badge>}
      </div>
      {lines.length === 0 ? (
        <p className="text-sm leading-5 text-muted">Empty address.</p>
      ) : (
        lines.map((line, i) => (
          <p key={i} className="text-sm leading-5 text-muted">
            {line}
          </p>
        ))
      )}
    </div>
  );
}

function OrderHistoryRow({ order }: { order: CustomerOrderRow }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm leading-5 font-medium text-brand">
          {order.order_number}
        </p>
        <p className="truncate text-xs leading-4 text-muted">
          {order.first_item_title ?? "—"}
          {order.items_count > 1 &&
            ` +${order.items_count - 1} more item${
              order.items_count - 1 === 1 ? "" : "s"
            }`}
        </p>
        <p className="text-xs leading-4 text-muted">
          {formatDate(order.created_at)} ·{" "}
          {order.total_quantity.toLocaleString()} unit
          {order.total_quantity === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-sm leading-5 font-medium text-brand tabular-nums">
          {formatCedis(order.total)}
        </p>
        {/* Same badge the Orders screen uses, off the same order-ops stage —
            so an order reads identically in both places. */}
        <StatusBadge status={stageToStatus(order.stage)} />
      </div>
    </div>
  );
}
