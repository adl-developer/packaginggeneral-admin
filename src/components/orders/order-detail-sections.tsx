import type {
  OrderDetail,
  OrderDetailActivity,
  OrderDetailAddress,
  OrderDetailFulfillment,
  OrderDetailItem,
  OrderDetailPayment,
  OrderDetailShippingMethod,
  OrderDetailTotals,
} from "@/lib/data/orders";
import { formatCedis, formatDate } from "@/lib/utils";

/**
 * Per-section render helpers for `OrderDetailDialog`, split out because the
 * dialog itself was growing past ~400 lines. Nothing here is a public
 * component in its own right — each piece is only ever mounted inside a
 * `<Collapsible>` in order-detail-dialog.tsx.
 */

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm leading-5 text-muted">{label}</dt>
      <dd className="text-sm leading-5 text-brand">{value}</dd>
    </div>
  );
}

/** Per-item Size/Material/Printing, or the single fallback line when the
 *  variant's labelled options could not be resolved (deleted variant etc). */
function ItemCustomization({ item }: { item: OrderDetailItem }) {
  const { size, material, printing, fallback } = item.customization;

  if (fallback) {
    return (
      <p className="text-xs leading-4 text-muted">
        <span className="font-medium">Variant:</span> {fallback}
      </p>
    );
  }

  const rows: [string, string][] = [
    ...(size ? ([["Size", size]] as [string, string][]) : []),
    ...(material ? ([["Material", material]] as [string, string][]) : []),
    ...(printing ? ([["Printing", printing]] as [string, string][]) : []),
  ];
  if (rows.length === 0) return null;

  return (
    <dl className="flex flex-col gap-0.5">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center gap-2 text-xs leading-4">
          <dt className="text-muted">{label}:</dt>
          <dd className="text-brand">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ItemsTable({ items }: { items: OrderDetailItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm leading-5 text-muted">No items on this order.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm leading-5 font-medium text-brand">
                {item.title ?? "Untitled item"}
              </p>
              {item.variant_title && (
                <p className="truncate text-xs leading-4 text-muted">
                  {item.variant_title}
                </p>
              )}
              {item.sku && (
                <p className="text-xs leading-4 text-muted">SKU: {item.sku}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm leading-5 text-brand">
                {item.quantity} × {formatCedis(item.unit_price)}
              </p>
              <p className="text-sm leading-5 font-medium text-brand">
                {formatCedis(item.line_total)}
              </p>
            </div>
          </div>
          <ItemCustomization item={item} />
        </div>
      ))}
    </div>
  );
}

export function PaymentModeBadge({ mode }: { mode: OrderDetailPayment["mode"] }) {
  if (mode !== "test") return null;
  return (
    <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-plum px-2 text-[11px] font-semibold leading-4 text-white">
      TEST
    </span>
  );
}

export function PaymentDetails({
  payment,
}: {
  payment: OrderDetailPayment | null;
}) {
  if (!payment) {
    return <p className="text-sm leading-5 text-muted">No payment.</p>;
  }

  return (
    <dl className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-sm leading-5 text-muted">Status</dt>
        <dd className="flex items-center gap-2 text-sm leading-5 text-brand">
          {payment.status ?? "—"}
          <PaymentModeBadge mode={payment.mode} />
        </dd>
      </div>
      <Field label="Provider" value={payment.provider ?? "—"} />
      <Field label="Authorized" value={formatCedis(payment.authorized)} />
      <Field label="Captured" value={formatCedis(payment.captured)} />
      <Field label="Refunded" value={formatCedis(payment.refunded)} />
      <Field label="Channel" value={payment.channel ?? "—"} />
      <Field label="Paystack reference" value={payment.reference ?? "—"} />
      <Field label="Transaction ID" value={payment.transaction_id ?? "—"} />
      <Field
        label="Paid at"
        value={payment.paid_at ? formatDate(payment.paid_at) : "—"}
      />
      <Field
        label="Paystack fee"
        value={payment.fee != null ? formatCedis(payment.fee) : "—"}
      />
    </dl>
  );
}

export function TotalsDetails({ totals }: { totals: OrderDetailTotals }) {
  return (
    <dl className="flex flex-col gap-2">
      <Field label="Subtotal" value={formatCedis(totals.subtotal)} />
      <Field label="Shipping" value={formatCedis(totals.shipping_total)} />
      <Field label="Tax" value={formatCedis(totals.tax_total)} />
      <Field label="Discounts" value={formatCedis(totals.discount_total)} />
      <Field label="Order total" value={formatCedis(totals.total)} />
      <Field label="Paid total" value={formatCedis(totals.paid_total)} />
      <Field label="Refunded total" value={formatCedis(totals.refunded_total)} />
      <Field
        label="Pending difference"
        value={formatCedis(totals.pending_difference)}
      />
    </dl>
  );
}

function addressLine(address: OrderDetailAddress) {
  return [address.address_1, address.address_2].filter(Boolean).join(", ");
}

function addressCityLine(address: OrderDetailAddress) {
  return [address.city, address.province, address.postal_code]
    .filter(Boolean)
    .join(", ");
}

export function DeliveryDetails({
  address,
  shippingMethods,
  fulfillments,
}: {
  address: OrderDetailAddress | null;
  shippingMethods: OrderDetailShippingMethod[];
  fulfillments: OrderDetailFulfillment[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        {address ? (
          <dl className="flex flex-col gap-2">
            <Field
              label="Recipient"
              value={
                [address.first_name, address.last_name].filter(Boolean).join(" ") ||
                "—"
              }
            />
            <Field label="Address" value={addressLine(address) || "—"} />
            <Field label="City" value={addressCityLine(address) || "—"} />
            <Field
              label="Country"
              value={address.country_code?.toUpperCase() ?? "—"}
            />
            <Field label="Phone" value={address.phone ?? "—"} />
          </dl>
        ) : (
          <p className="text-sm leading-5 text-muted">No address.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium leading-4 text-muted">
          Shipping method
        </p>
        {shippingMethods.length === 0 ? (
          <p className="text-sm leading-5 text-muted">No shipping method.</p>
        ) : (
          <dl className="flex flex-col gap-2">
            {shippingMethods.map((method) => (
              <Field
                key={method.id}
                label={method.name}
                value={formatCedis(method.amount)}
              />
            ))}
          </dl>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium leading-4 text-muted">Fulfilment</p>
        {fulfillments.length === 0 ? (
          <p className="text-sm leading-5 text-muted">Fulfilment: Not started</p>
        ) : (
          <dl className="flex flex-col gap-2">
            {fulfillments.map((f) => (
              <div key={f.id} className="flex flex-col gap-1 text-sm leading-5">
                {f.packed_at && (
                  <Field label="Packed" value={formatDate(f.packed_at)} />
                )}
                {f.shipped_at && (
                  <Field label="Shipped" value={formatDate(f.shipped_at)} />
                )}
                {f.delivered_at && (
                  <Field label="Delivered" value={formatDate(f.delivered_at)} />
                )}
                {f.canceled_at && (
                  <Field label="Canceled" value={formatDate(f.canceled_at)} />
                )}
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}

export function CustomerDetails({ order }: { order: OrderDetail }) {
  const { customer, email, metadata } = order;
  const companyName =
    typeof metadata?.company_name === "string" ? metadata.company_name : null;
  const contactPerson =
    typeof metadata?.contact_person === "string" ? metadata.contact_person : null;
  const contactPhone =
    typeof metadata?.contact_phone === "string" ? metadata.contact_phone : null;

  return (
    <dl className="flex flex-col gap-2">
      <Field label="Name" value={customer?.name ?? "—"} />
      <Field label="Email" value={customer?.email ?? email ?? "—"} />
      <Field label="Phone" value={customer?.phone ?? "—"} />
      <Field
        label="Account"
        value={customer?.has_account ? "Registered account" : "Guest checkout"}
      />
      {(companyName || contactPerson || contactPhone) && (
        <>
          <Field label="Company" value={companyName ?? "—"} />
          <Field label="Contact person" value={contactPerson ?? "—"} />
          <Field label="Contact phone" value={contactPhone ?? "—"} />
        </>
      )}
    </dl>
  );
}

export function MetadataDetails({ order }: { order: OrderDetail }) {
  return (
    <dl className="flex flex-col gap-2">
      <Field label="Order ID" value={order.id} />
      <Field label="Native status" value={order.native_status} />
      <Field label="Sales channel" value={order.sales_channel_id ?? "—"} />
      <Field label="Region" value={order.region_id ?? "—"} />
      <Field label="Currency" value={order.currency_code} />
      <Field label="Draft order" value={order.is_draft_order ? "Yes" : "No"} />
      <Field label="Created" value={formatDate(order.created_at)} />
      <Field label="Updated" value={formatDate(order.updated_at)} />
    </dl>
  );
}

export function NotesList({ notes }: { notes: OrderDetailActivity[] }) {
  if (notes.length === 0) {
    return <p className="text-sm leading-5 text-muted">No notes yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {notes.map((n) => (
        <li key={n.id} className="text-sm leading-5 text-brand">
          {n.detail}
          <span className="block text-xs leading-4 text-muted">
            {n.actor_name} · {formatDate(n.created_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ActivityList({
  activities,
}: {
  activities: OrderDetailActivity[];
}) {
  if (activities.length === 0) {
    return <p className="text-sm leading-5 text-muted">No activity yet.</p>;
  }
  return (
    <ol className="flex flex-col">
      {activities.map((entry, i) => (
        <li
          key={entry.id}
          className={
            i === activities.length - 1
              ? "flex flex-col gap-0.5 py-3"
              : "flex flex-col gap-0.5 border-b border-line py-3"
          }
        >
          <p className="text-sm leading-5 text-brand">
            <span className="font-medium">{entry.actor_name}</span>{" "}
            {entry.detail ?? entry.type}
          </p>
          <p className="text-xs leading-4 text-muted">
            {formatDate(entry.created_at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
