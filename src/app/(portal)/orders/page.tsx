"use client";

import * as React from "react";
import { ChevronDown, ListFilter, Search, User, Users, X } from "lucide-react";
import { DateFilterBar } from "@/components/layout/date-filter-bar";
import { CancelOrderDialog } from "@/components/orders/cancel-order-dialog";
import { OrderDetailDialog } from "@/components/orders/order-detail-dialog";
import { StatusBadge } from "@/components/orders/status-badge";
import { StatusCountCards } from "@/components/orders/status-count-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { statusCounts } from "@/lib/data";
import { TOTAL_ORDERS_ALL_TIME } from "@/lib/data/mock";
import {
  ORDER_STATUS_CHIP,
  type Order,
  type OrderStatus,
} from "@/lib/data/types";
import { useAdmin } from "@/lib/store";
import { useDateFilter } from "@/lib/use-date-filter";
import { cn, formatDate } from "@/lib/utils";

const STATUSES: OrderStatus[] = [
  "new",
  "in-progress",
  "ready",
  "delivered",
  "cancelled",
];

/**
 * Order Management — Figma 3835:19533 (+ filtered state 3847:20856).
 *
 * Structure follows the design exactly: the heading sits on the page background,
 * then a standalone 1200×86 filter card, then the five status count cards, then
 * the table card.
 *
 * Table header cells here are 14px/500 muted — note this DIFFERS from the
 * Customers table, whose headers are 12px/600 with +0.3 tracking.
 */
export default function OrdersPage() {
  const {
    orders,
    team,
    claimOrder,
    advanceStage,
    cancelOrder,
    addNote,
    assignWorker,
  } = useAdmin();
  const { start, end, range, setStart, setEnd, setRange, filtered } =
    useDateFilter(orders);

  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<OrderStatus | "">("");
  const [worker, setWorker] = React.useState("");
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [cancelId, setCancelId] = React.useState<string | null>(null);

  const counts = statusCounts(filtered);

  const visible = filtered.filter((o) => {
    if (status && o.status !== status) return false;
    if (worker && o.assignedTo !== worker) return false;
    if (query) {
      const q = query.toLowerCase();
      if (
        !o.number.toLowerCase().includes(q) &&
        !o.product.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const detail = orders.find((o) => o.id === detailId) ?? null;
  const cancelling = orders.find((o) => o.id === cancelId) ?? null;
  const workerName = team.find((m) => m.id === worker)?.name;

  return (
    <>
      <DateFilterBar
        start={start}
        end={end}
        range={range}
        onStart={setStart}
        onEnd={setEnd}
        onRange={setRange}
        showing={filtered.length}
        total={TOTAL_ORDERS_ALL_TIME}
      />

      {/* Heading — on the page background, not inside a card (per Figma). */}
      <div className="mt-6">
        <h2 className="text-2xl leading-8 font-semibold text-brand">
          Order Management
        </h2>
        <p className="pt-1 text-sm leading-5 text-muted">
          Track orders through stages and manage assignments
        </p>
      </div>

      {/* Search + filters card */}
      <Card className="mt-6 p-6">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order number or product..."
              aria-label="Search orders"
              className="pl-10"
            />
          </div>

          <SelectPicker
            icon={<ListFilter className="size-4 text-muted" aria-hidden />}
            label="Filter by status"
            value={status}
            onChange={(v) => setStatus(v as OrderStatus | "")}
            options={[
              { value: "", label: "All Statuses" },
              ...STATUSES.map((s) => ({
                value: s,
                label: ORDER_STATUS_CHIP[s],
              })),
            ]}
          />

          <SelectPicker
            icon={<Users className="size-4 text-muted" aria-hidden />}
            label="Filter by worker"
            value={worker}
            onChange={setWorker}
            options={[
              { value: "", label: "All Workers" },
              ...team.map((m) => ({ value: m.id, label: m.name })),
            ]}
          />
        </div>
      </Card>

      <div className="mt-6">
        <StatusCountCards
          counts={counts}
          active={status}
          onSelect={setStatus}
        />
      </div>

      {/* Worker-filter banner — Figma "Showing orders for Emmanuel" */}
      {worker && (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-card border border-line bg-[rgba(196,188,176,0.3)] px-6 py-3">
          <p className="text-sm leading-5 text-brand">
            Showing orders for {workerName}
          </p>
          <button
            type="button"
            onClick={() => setWorker("")}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-brand"
          >
            <X className="size-3.5" aria-hidden />
            Clear filter
          </button>
        </div>
      )}

      {/* Table card */}
      <Card className="mt-6">
        <CardHeader className="px-6 py-4">
          <h3 className="text-lg leading-7 font-medium text-brand">
            All Orders ({visible.length})
          </h3>
        </CardHeader>

        <CardContent className="pt-0">
          {visible.length === 0 ? (
            <p className="border-t border-line py-12 text-center text-sm text-muted">
              No orders found
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  {[
                    "Order #",
                    "Product",
                    "Qty",
                    "Total (GH₵)",
                    "Status",
                    "Assigned To",
                    "Date",
                  ].map((h) => (
                    <TH
                      key={h}
                      className="pb-3 text-sm font-medium tracking-[-0.15px]"
                    >
                      {h}
                    </TH>
                  ))}
                  <TH className="pb-3 text-right text-sm font-medium tracking-[-0.15px]">
                    Actions
                  </TH>
                </TR>
              </THead>
              <TBody>
                {visible.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    assignee={
                      team.find((m) => m.id === order.assignedTo)?.name ?? null
                    }
                    canClaim={!order.assignedTo && order.status === "new"}
                    onClaim={() => claimOrder(order.id)}
                    onView={() => setDetailId(order.id)}
                  />
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {detail && (
        <OrderDetailDialog
          order={detail}
          team={team}
          open
          onClose={() => setDetailId(null)}
          onAssign={(memberId) => assignWorker(detail.id, memberId)}
          onAdvance={() => advanceStage(detail.id)}
          onAddNote={(note) => addNote(detail.id, note)}
          onRequestCancel={() => {
            setCancelId(detail.id);
            setDetailId(null);
          }}
        />
      )}

      {cancelling && (
        <CancelOrderDialog
          order={cancelling}
          open
          onClose={() => setCancelId(null)}
          onConfirm={(opts) => {
            cancelOrder(cancelling.id, opts);
            setCancelId(null);
          }}
        />
      )}
    </>
  );
}

/**
 * Figma renders these as a 16px leading icon plus a 180×36 button-styled
 * control with a trailing chevron. A native <select> is overlaid so the control
 * stays keyboard- and screen-reader-friendly.
 */
function SelectPicker({
  icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const current = options.find((o) => o.value === value)?.label ?? options[0].label;
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="relative lg:w-[180px]">
        <span
          className={cn(
            "pointer-events-none flex h-9 w-full items-center justify-between gap-2 rounded-button",
            "border border-line bg-surface px-3",
            "text-sm leading-5 font-medium text-brand",
          )}
        >
          <span className="truncate">{current}</span>
          <ChevronDown className="size-4 shrink-0 text-muted" aria-hidden />
        </span>
        <select
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function OrderRow({
  order,
  assignee,
  canClaim,
  onClaim,
  onView,
}: {
  order: Order;
  assignee: string | null;
  canClaim: boolean;
  onClaim: () => void;
  onView: () => void;
}) {
  return (
    <TR>
      <TD className="font-medium whitespace-nowrap">{order.number}</TD>
      <TD>
        <span className="block text-sm leading-5 text-brand">
          {order.product}
        </span>
        <span className="block text-xs leading-4 text-muted">
          {order.variant}
        </span>
      </TD>
      <TD className="tabular-nums">{order.quantity.toLocaleString()}</TD>
      <TD className="font-medium tabular-nums">
        {order.total.toLocaleString("en-GH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </TD>
      <TD>
        <StatusBadge status={order.status} />
      </TD>
      <TD>
        {/* Figma: 24px #c4bcb0 circle with a 12px muted user glyph, gap 8. */}
        <span className="flex items-center gap-2">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-line">
            <User className="size-3 text-muted" aria-hidden />
          </span>
          <span className={assignee ? "text-brand" : "text-muted"}>
            {assignee ?? "Unassigned"}
          </span>
        </span>
      </TD>
      <TD className="whitespace-nowrap text-muted">
        {formatDate(order.placedAt)}
      </TD>
      <TD>
        <div className="flex items-center justify-end gap-2">
          {canClaim && (
            <Button size="sm" variant="outline" onClick={onClaim}>
              Claim
            </Button>
          )}
          <Button size="sm" variant="rust" onClick={onView}>
            View
          </Button>
        </div>
      </TD>
    </TR>
  );
}
