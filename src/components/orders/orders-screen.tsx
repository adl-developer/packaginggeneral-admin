"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ListFilter, Search, User, Users, X } from "lucide-react";
import { OrderDetailDialog } from "@/components/orders/order-detail-dialog";
import { StatusBadge } from "@/components/orders/status-badge";
import { StatusCountCards } from "@/components/orders/status-count-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import {
  addNote,
  claimOrder,
  fetchOrderDetail,
  setStage,
} from "@/lib/actions/orders";
import type {
  OrderDetail,
  OrderListRow,
  OrdersListPayload,
} from "@/lib/data/orders";
import { NEXT_STAGE, ORDER_STATUS_CHIP, type OrderStatus } from "@/lib/data/types";
import { isOrderStage, stageToStatus, statusToStage } from "@/lib/stage-mapping";
import { cn, formatDate } from "@/lib/utils";

const STATUSES: OrderStatus[] = [
  "new",
  "in-progress",
  "ready",
  "delivered",
  "cancelled",
];

/** Mirrors the URL params the Server Component read — see page.tsx. */
export type OrdersFilters = { stage: string; worker: string; q: string };

type DetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; order: OrderDetail };

/**
 * Order Management — Figma 3835:19533 (+ filtered state 3847:20856), now wired
 * to live Medusa data.
 *
 * `payload`/`filters` come from the Server Component (orders/page.tsx),
 * fetched server-side from the URL's own `stage`/`worker`/`q` — that URL is
 * the single source of truth for what's on screen, so a status chip or the
 * worker banner can never claim a scope the fetched rows don't actually
 * match. Every filter change here re-navigates (via `router.replace`) rather
 * than filtering client-side, which is what re-triggers that server fetch.
 *
 * ⚠ No date-range bar. Unlike Inventory (whose `ordered_in_range` is a real
 * server-computed aggregate over a window), `GET /admin/pg/orders-ops` has no
 * date filtering at all — wiring one up here would either lie (a client-side
 * filter over an already-narrow, unrelated-to-date server response) or need
 * backend work outside this task's scope. Left out rather than faked.
 *
 * ⚠ The worker filter's options are derived from `payload.orders` — the
 * distinct assignees actually present in the CURRENT fetch — not from the
 * mock team roster (`lib/store.tsx`), which has no relationship to real
 * Medusa admin-user ids (Task 15/16 will give this a real backend). One
 * consequence: once a worker filter is active, the option list temporarily
 * narrows to just that worker (the fetch is now scoped to them). Clearing
 * back to "All Workers" (or the "Clear filter" banner below) restores the
 * full list. Not a lie — every option shown is always a real, currently
 * fetchable worker — just a known rough edge until a real roster exists.
 */
export function OrdersScreen({
  payload,
  filters,
}: {
  payload: OrdersListPayload;
  filters: OrdersFilters;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const [queryText, setQueryText] = React.useState(filters.q);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [detailState, setDetailState] = React.useState<DetailState | null>(
    null,
  );
  const [claimingId, setClaimingId] = React.useState<string | null>(null);
  const [dialogBusy, setDialogBusy] = React.useState(false);
  const [dialogError, setDialogError] = React.useState<string | null>(null);

  const activeStatus: OrderStatus | "" = isOrderStage(filters.stage)
    ? stageToStatus(filters.stage)
    : "";

  const counts: Record<OrderStatus, number> = {
    new: payload.stage_counts.new,
    "in-progress": payload.stage_counts.in_progress,
    ready: payload.stage_counts.ready_for_delivery,
    delivered: payload.stage_counts.delivered,
    cancelled: payload.stage_counts.cancelled,
  };

  const workerOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const o of payload.orders) {
      if (o.assigned_to_id) {
        seen.set(o.assigned_to_id, o.assigned_to_name ?? o.assigned_to_id);
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [payload.orders]);

  const workerLabel =
    filters.worker === "unassigned"
      ? "Unassigned"
      : (payload.orders.find((o) => o.assigned_to_id === filters.worker)
          ?.assigned_to_name ?? filters.worker);

  function navigate(next: Partial<OrdersFilters>) {
    const merged = { ...filters, ...next };
    const qs = new URLSearchParams();
    if (merged.stage) qs.set("stage", merged.stage);
    if (merged.worker) qs.set("worker", merged.worker);
    if (merged.q) qs.set("q", merged.q);
    startTransition(() => {
      router.replace(`/orders${qs.toString() ? `?${qs}` : ""}`, {
        scroll: false,
      });
    });
  }

  // Debounce the search box into the URL. Skip the very first effect run —
  // the server already fetched exactly what the URL says, so re-issuing that
  // same navigation on mount would be a wasted round trip (same guard as
  // Inventory's date-range effect).
  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const t = setTimeout(() => navigate({ q: queryText }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryText]);

  async function openDetail(id: string) {
    setDetailId(id);
    setDetailState({ status: "loading" });
    setDialogError(null);
    const result = await fetchOrderDetail(id);
    setDetailState(
      result.ok
        ? { status: "loaded", order: result.order }
        : { status: "error", message: result.error },
    );
  }

  function closeDetail() {
    setDetailId(null);
    setDetailState(null);
    setDialogError(null);
  }

  async function refreshDetail(id: string) {
    const result = await fetchOrderDetail(id);
    if (result.ok) {
      setDetailState({ status: "loaded", order: result.order });
    }
    // A refresh failure leaves the previous loaded order on screen rather
    // than replacing it with an error — the mutation itself already
    // succeeded (or its own error is already surfaced via dialogError); losing
    // a good view because the FOLLOW-UP refetch hiccuped would be worse.
  }

  async function handleRowClaim(id: string) {
    setClaimingId(id);
    await claimOrder(id);
    setClaimingId(null);
    router.refresh();
  }

  async function handleDialogClaim() {
    if (!detailId) return;
    setDialogBusy(true);
    setDialogError(null);
    const result = await claimOrder(detailId);
    if (!result.ok) {
      setDialogError(result.error);
      setDialogBusy(false);
      return;
    }
    await refreshDetail(detailId);
    router.refresh();
    setDialogBusy(false);
  }

  async function handleAdvance() {
    if (!detailId || detailState?.status !== "loaded") return;
    const current = stageToStatus(detailState.order.stage);
    const next = NEXT_STAGE[current];
    if (!next) return;
    setDialogBusy(true);
    setDialogError(null);
    const result = await setStage(detailId, statusToStage(next));
    if (!result.ok) {
      setDialogError(result.error);
      setDialogBusy(false);
      return;
    }
    await refreshDetail(detailId);
    router.refresh();
    setDialogBusy(false);
  }

  async function handleAddNote(note: string) {
    if (!detailId) return;
    setDialogBusy(true);
    setDialogError(null);
    const result = await addNote(detailId, note);
    if (!result.ok) {
      setDialogError(result.error);
      setDialogBusy(false);
      return;
    }
    await refreshDetail(detailId);
    router.refresh();
    setDialogBusy(false);
  }

  return (
    <div className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
      {/* Heading — on the page background, not inside a card (per Figma). */}
      <div>
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
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search by order number or product..."
              aria-label="Search orders"
              className="pl-10"
            />
          </div>

          <SelectPicker
            icon={<ListFilter className="size-4 text-muted" aria-hidden />}
            label="Filter by status"
            value={filters.stage}
            onChange={(v) => navigate({ stage: v })}
            options={[
              { value: "", label: "All Statuses" },
              ...STATUSES.map((s) => ({
                value: statusToStage(s),
                label: ORDER_STATUS_CHIP[s],
              })),
            ]}
          />

          <SelectPicker
            icon={<Users className="size-4 text-muted" aria-hidden />}
            label="Filter by worker"
            value={filters.worker}
            onChange={(v) => navigate({ worker: v })}
            options={[
              { value: "", label: "All Workers" },
              { value: "unassigned", label: "Unassigned" },
              ...workerOptions.map((w) => ({ value: w.id, label: w.name })),
            ]}
          />
        </div>
      </Card>

      <div className="mt-6">
        <StatusCountCards
          counts={counts}
          active={activeStatus}
          onSelect={(status) =>
            navigate({ stage: status ? statusToStage(status) : "" })
          }
        />
      </div>

      {/* Worker-filter banner — Figma "Showing orders for Emmanuel" */}
      {filters.worker && (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-card border border-line bg-[rgba(196,188,176,0.3)] px-6 py-3">
          <p className="text-sm leading-5 text-brand">
            Showing orders for {workerLabel}
          </p>
          <button
            type="button"
            onClick={() => navigate({ worker: "" })}
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
            All Orders ({payload.count})
          </h3>
        </CardHeader>

        <CardContent className="pt-0">
          {payload.orders.length === 0 ? (
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
                {payload.orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    claiming={claimingId === order.id}
                    onClaim={() => handleRowClaim(order.id)}
                    onView={() => openDetail(order.id)}
                  />
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {payload.truncated && (
        <p className="mt-4 text-center text-xs text-muted">
          Only the most recently scanned orders are shown — the true total
          may be higher.
        </p>
      )}

      {detailId && detailState?.status === "loading" && (
        <Dialog open onClose={closeDetail} title="Loading order…">
          <p className="text-sm leading-5 text-muted">
            Fetching the latest order details…
          </p>
        </Dialog>
      )}

      {detailId && detailState?.status === "error" && (
        <Dialog open onClose={closeDetail} title="Couldn't load this order">
          <p className="text-sm leading-5 text-muted">{detailState.message}</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => openDetail(detailId)}
          >
            Try again
          </Button>
        </Dialog>
      )}

      {detailId && detailState?.status === "loaded" && (
        <>
          <OrderDetailDialog
            order={detailState.order}
            open
            onClose={closeDetail}
            onClaim={handleDialogClaim}
            onAdvance={handleAdvance}
            onAddNote={handleAddNote}
            busy={dialogBusy}
          />
          {/* dialogError surfaces OUTSIDE the dialog's own footer (which
              OrderDetailDialog owns) as a transient toast-style banner. */}
          {dialogError && (
            <div
              role="alert"
              className="fixed inset-x-0 bottom-6 z-[60] mx-auto w-fit max-w-[90vw] rounded-button border border-[rgba(155,107,143,0.4)] bg-surface px-4 py-2 text-sm text-plum shadow-header"
            >
              {dialogError}
            </div>
          )}
        </>
      )}
    </div>
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
  const current =
    options.find((o) => o.value === value)?.label ?? options[0].label;
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
  claiming,
  onClaim,
  onView,
}: {
  order: OrderListRow;
  claiming: boolean;
  onClaim: () => void;
  onView: () => void;
}) {
  const canClaim = !order.assigned_to_id && order.stage === "new";
  return (
    <TR>
      <TD className="font-medium whitespace-nowrap">{order.order_number}</TD>
      <TD>
        <span className="block text-sm leading-5 text-brand">
          {order.first_item_title ?? "—"}
        </span>
        {order.first_item_variant && (
          <span className="block text-xs leading-4 text-muted">
            {order.first_item_variant}
          </span>
        )}
        {order.items_count > 1 && (
          <span className="block text-xs leading-4 text-muted">
            +{order.items_count - 1} more item
            {order.items_count - 1 === 1 ? "" : "s"}
          </span>
        )}
      </TD>
      <TD className="tabular-nums">{order.total_quantity.toLocaleString()}</TD>
      <TD className="font-medium tabular-nums">
        {order.total.toLocaleString("en-GH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </TD>
      <TD>
        <StatusBadge status={stageToStatus(order.stage)} />
      </TD>
      <TD>
        {/* Figma: 24px #c4bcb0 circle with a 12px muted user glyph, gap 8. */}
        <span className="flex items-center gap-2">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-line">
            <User className="size-3 text-muted" aria-hidden />
          </span>
          <span className={order.assigned_to_name ? "text-brand" : "text-muted"}>
            {order.assigned_to_name ?? "Unassigned"}
          </span>
        </span>
      </TD>
      <TD className="whitespace-nowrap text-muted">
        {formatDate(order.created_at)}
      </TD>
      <TD>
        <div className="flex items-center justify-end gap-2">
          {canClaim && (
            <Button size="sm" variant="outline" disabled={claiming} onClick={onClaim}>
              {claiming ? "Claiming…" : "Claim"}
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
