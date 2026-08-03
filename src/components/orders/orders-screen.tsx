"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { OrderDetailDialog } from "@/components/orders/order-detail-dialog";
import { StatusBadge } from "@/components/orders/status-badge";
import { StatusCountCards } from "@/components/orders/status-count-cards";
import { ErrorToastStack, type ErrorToast } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { addNote, claimOrder, setStage } from "@/lib/actions/orders";
import type { OrderListRow, OrdersListPayload } from "@/lib/data/orders";
import type { Worker } from "@/lib/data/users";
import { NEXT_STAGE, ORDER_STATUS_CHIP, type OrderStatus } from "@/lib/data/types";
import {
  ordersHref,
  pageCount,
  showingLabel,
  showingRange,
} from "@/lib/pagination";
import { isOrderStage, stageToStatus, statusToStage } from "@/lib/stage-mapping";
import { cn, formatDate } from "@/lib/utils";
import { useOrderDetail } from "@/components/orders/use-order-detail";

const STATUSES: OrderStatus[] = [
  "new",
  "in-progress",
  "ready",
  "delivered",
  "cancelled",
];

/** Mirrors the URL params the Server Component read — see page.tsx.
 *  `page` is 1-based and already clamped server-side. */
export type OrdersFilters = {
  stage: string;
  worker: string;
  q: string;
  page: number;
};

/**
 * Order Management — Figma 3835:19533 (+ filtered state 3847:20856), now wired
 * to live Medusa data.
 *
 * `payload`/`filters` come from the Server Component (orders/page.tsx),
 * fetched server-side from the URL's own `stage`/`worker`/`q`/`page` — that
 * URL is the single source of truth for what's on screen, so a status chip,
 * the worker banner or the pager can never claim a scope the fetched rows
 * don't actually match. Every filter or page change here re-navigates (via
 * `router.replace`) rather than filtering client-side, which is what
 * re-triggers that server fetch.
 *
 * ⚠ Pagination is genuinely server-side: `payload.orders` is ONE page and
 * `payload.count` is the whole filtered total. Anything derived from
 * `payload.orders` therefore describes the page, not the result — which is why
 * `payload.stage_counts` (whole-dataset, backend-computed) drives the chips
 * rather than a tally over the rows.
 *
 * ⚠ No date-range bar. Unlike Inventory (whose `ordered_in_range` is a real
 * server-computed aggregate over a window), `GET /admin/pg/orders-ops` has no
 * date filtering at all — wiring one up here would either lie (a client-side
 * filter over an already-narrow, unrelated-to-date server response) or need
 * backend work outside this task's scope. Left out rather than faked.
 *
 * ⚠ The worker filter's options come from `workers` — the real staff roster,
 * fetched server-side from `GET /admin/pg/users` (see orders/page.tsx). They
 * must NOT be derived from `payload.orders`: that is one page of 20, so a
 * colleague whose orders all sit on page 4 would be unselectable from page 1.
 * If the roster fetch fails it arrives empty rather than taking this screen
 * down with it, and the active worker is pinned into the list either way, so
 * a filter set from elsewhere is always visible and clearable.
 */
export function OrdersScreen({
  payload,
  workers,
  filters,
}: {
  payload: OrdersListPayload;
  workers: Worker[];
  filters: OrdersFilters;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const [queryText, setQueryText] = React.useState(filters.q);
  const detail = useOrderDetail();
  const [claimingId, setClaimingId] = React.useState<string | null>(null);
  // Independent of the dialog: a row's Claim button can fail (most commonly
  // a 409 — someone else claimed it first, see `lib/actions/orders.ts`) and
  // that needs to reach the operator, not just quietly stop the button's
  // "Claiming…" label. Not scoped to a row — it renders in the shared toast
  // stack below (see `toasts`), which is what actually determines where and
  // how it's shown, so there's nothing here for a row id to key off.
  const [claimError, setClaimError] = React.useState<string | null>(null);

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

  // The active worker's display name, best-effort in this order: the roster,
  // then a row on this page that is assigned to them (covers a deactivated or
  // otherwise unlisted account still holding orders), then the raw id. Never a
  // guess — an id is honest, an invented name is not.
  const workerLabel =
    filters.worker === "unassigned"
      ? "Unassigned"
      : (workers.find((w) => w.id === filters.worker)?.name ??
        payload.orders.find((o) => o.assigned_to_id === filters.worker)
          ?.assigned_to_name ??
        filters.worker);

  const workerOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    // The active worker first, so a filter that survived a roster outage — or
    // points at someone no longer on the roster — is still visible and
    // clearable rather than silently dropping out of the control.
    if (filters.worker && filters.worker !== "unassigned") {
      seen.set(filters.worker, workerLabel);
    }
    for (const w of workers) {
      seen.set(w.id, w.name);
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [workers, filters.worker, workerLabel]);

  const totalPages = pageCount(payload.count, payload.limit);
  const range = showingRange(
    payload.count,
    payload.offset,
    payload.orders.length,
  );

  /**
   * A FILTER change. Always returns to page 1 — landing on page 5 of a filter
   * with two pages is the classic pagination bug, and `ordersHref` drops
   * `?page=` for page 1, so this is the default simply by not passing one.
   */
  function navigate(next: Partial<Omit<OrdersFilters, "page">>) {
    const merged = { ...filters, ...next };
    push(ordersHref({ stage: merged.stage, worker: merged.worker, q: merged.q }));
  }

  /** A PAGE change. Keeps every filter exactly as-is. */
  function goToPage(page: number) {
    push(
      ordersHref({
        stage: filters.stage,
        worker: filters.worker,
        q: filters.q,
        page: Math.min(Math.max(1, page), totalPages),
      }),
    );
  }

  function push(href: string) {
    startTransition(() => {
      router.replace(href, { scroll: false });
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

  async function handleRowClaim(id: string) {
    setClaimingId(id);
    setClaimError(null);
    const result = await claimOrder(id);
    setClaimingId(null);
    if (!result.ok) {
      // Mirrors the dialog's claim path: surface the failure, don't refresh.
      // The backend's message already explains why (e.g. a 409 "Order
      // already claimed by X") — the operator needs to see that, not just a
      // button that silently stops saying "Claiming…".
      setClaimError(result.error);
      return;
    }
    router.refresh();
  }

  function handleDialogClaim() {
    return detail.mutate((id) => claimOrder(id));
  }

  function handleAdvance() {
    if (detail.detailState?.status !== "loaded") return Promise.resolve();
    const current = stageToStatus(detail.detailState.order.stage);
    const next = NEXT_STAGE[current];
    if (!next) return Promise.resolve();
    return detail.mutate((id) => setStage(id, statusToStage(next)));
  }

  function handleAddNote(note: string) {
    return detail.mutate((id) => addNote(id, note));
  }

  // A single toast STACK rather than two independently-positioned banners.
  // Both `detail.error` (a dialog mutation, e.g. a failed "Move to X") and
  // `claimError` (a row's Claim button) are genuinely independent failures —
  // the operator can trigger one, then the other, without either being
  // resolved yet (open a different order's dialog while a still-unread row
  // claim error is showing, for instance). Reusing the exact same fixed
  // position for both used to mean two live errors rendered on top of each
  // other, unreadable. Neither is dropped to fix that: both always render,
  // stacked with a gap, each independently dismissible.
  const toasts: ErrorToast[] = [];
  if (detail.error) {
    toasts.push({ key: "dialog", message: detail.error, onDismiss: detail.clearError });
  }
  if (claimError) {
    toasts.push({
      key: "claim",
      message: claimError,
      onDismiss: () => setClaimError(null),
    });
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
                    onView={() => detail.open(order.id)}
                  />
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pager. `payload.count` is the whole filtered total, so "Showing 1–20
          of 137" describes the result, not the page — the operator always
          knows where they are. Rendered whenever anything matched, including
          single-page results (the position line is the useful half); the
          buttons only appear once there is somewhere to go. */}
      {payload.count > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm leading-5 text-muted">{showingLabel(range)}</p>

          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                disabled={isPending || filters.page <= 1}
                onClick={() => goToPage(filters.page - 1)}
              >
                <ChevronLeft className="size-4" aria-hidden />
                Previous
              </Button>
              <span
                className="text-sm leading-5 text-muted tabular-nums"
                aria-live="polite"
              >
                Page {filters.page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending || !payload.has_more}
                onClick={() => goToPage(filters.page + 1)}
              >
                Next
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          )}
        </div>
      )}

      {detail.detailId && detail.detailState?.status === "loading" && (
        <Dialog open onClose={detail.close} title="Loading order…">
          <p className="text-sm leading-5 text-muted">
            Fetching the latest order details…
          </p>
        </Dialog>
      )}

      {detail.detailId && detail.detailState?.status === "error" && (
        <Dialog open onClose={detail.close} title="Couldn't load this order">
          <p className="text-sm leading-5 text-muted">
            {detail.detailState.message}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => detail.open(detail.detailId!)}
          >
            Try again
          </Button>
        </Dialog>
      )}

      {detail.detailId && detail.detailState?.status === "loaded" && (
        <OrderDetailDialog
          order={detail.detailState.order}
          open
          onClose={detail.close}
          onClaim={handleDialogClaim}
          onAdvance={handleAdvance}
          onAddNote={handleAddNote}
          busy={detail.busy}
        />
      )}

      {/* Shared toast stack — see the `toasts` comment above for why this
          isn't two independently-positioned banners. The markup itself now
          lives in `ui/alert.tsx`, shared with the Users screen, so the two
          don't drift the next time either one's error handling changes. */}
      <ErrorToastStack toasts={toasts} />
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
