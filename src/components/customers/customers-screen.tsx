"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { AccountBadge } from "@/components/customers/account-badge";
import { CustomerDetailDialog } from "@/components/customers/customer-detail-dialog";
import { useCustomerDetail } from "@/components/customers/use-customer-detail";
import { DateFilterBar } from "@/components/layout/date-filter-bar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { customersHref } from "@/lib/customers-range";
import type { CustomerRow, CustomersPayload } from "@/lib/data/customers";
import { presetRange } from "@/lib/date-range-math";
import { useDateRange, type DateRangeSeed } from "@/lib/use-date-range";

const nf = new Intl.NumberFormat("en-GH");

/** Marks the order count as a floor rather than a complete total when the
 *  backend's per-customer order scan hit its cap (see the header comment on
 *  `backend/src/api/admin/pg/customers/route.ts`) — same convention as
 *  `inventory-table.tsx`'s `fmtOrdered`. */
function fmtOrders(n: number, sampled: boolean): string {
  return sampled ? `${nf.format(n)}+` : nf.format(n);
}

/**
 * Customers — Figma 3847:20531.
 * Heading 18px/600, caption 14px/400 muted, then the customer table.
 * The design shows an em dash where a customer has no company; the backend
 * (customer.email/phone are optional on Medusa's Customer entity) can also
 * omit email, which gets the same em-dash treatment.
 *
 * ⚠ DELIBERATE DIVERGENCE from the Figma frame, requested by the user
 * 2026-08-02: the Phone column is replaced by **Account** (Registered /
 * Guest), and a row opens a customer-detail dialog. Phone hasn't been dropped
 * from the data — it is still searchable here and shown in full in the dialog.
 * Do not "fix" the column back in a design-parity pass.
 *
 * The caption reads "N customers · M registered" rather than the frame's "N
 * registered customers": this list has always included guest-checkout records
 * (Medusa creates a customer row for a guest order), so with the Account
 * column now making that visible, the old caption would be contradicted by the
 * table right underneath it.
 *
 * ⚠ The date range is genuinely SERVER-side: changing it re-navigates, which
 * re-runs the Server Component's fetch. It must never become a client-side
 * filter — `payload.customers` is capped at the backend's scan cap, so a
 * client-side window over it would silently miss customers AND leave the
 * caption's `total_customers` describing a different scope from the rows. The
 * name/email search below IS client-side and stays so: it narrows what the
 * server already returned rather than claiming to search the whole dataset.
 */
export function CustomersScreen({
  payload,
  seed,
}: {
  payload: CustomersPayload;
  /** The EXACT window the server fetched — see `customers/page.tsx`. */
  seed: DateRangeSeed;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [query, setQuery] = React.useState("");
  const detail = useCustomerDetail();
  const dates = useDateRange(seed);

  // The URL is the source of truth, and the operator can change it without
  // going through the controls above — Back/Forward, a bookmark, a shared
  // link. `useDateRange` only reads the seed to initialise, and a
  // `router.replace` re-renders this component rather than remounting it, so
  // without this the bar would keep displaying the previous window over rows
  // fetched for a different one. Re-seeding with values already held is a
  // no-op, so this is inert for range changes we initiated ourselves.
  const { reset } = dates;
  React.useEffect(() => {
    reset({ start: seed.start, end: seed.end, range: seed.range });
  }, [reset, seed.start, seed.end, seed.range]);

  function push(href: string) {
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  /**
   * Each range change updates the control AND navigates. Both, deliberately:
   * the navigation is what re-fetches, the local update is what keeps the
   * inputs responsive while that transition is in flight. The server's
   * response re-seeds the control on the next mount, so what's displayed is
   * always what was fetched.
   */
  function applyPreset(key: "7d" | "30d" | "60d" | "90d") {
    const { from, to } = presetRange(key);
    dates.applyPreset(key);
    push(customersHref({ start: from, end: to, range: key }));
  }

  function clearRange() {
    dates.clearRange();
    push(customersHref({}));
  }

  // Hand-editing either date drops the preset highlight (useDateRange does
  // that part) — the window is no longer one of the four presets.
  function editStart(v: string) {
    dates.editStart(v);
    push(customersHref({ start: v, end: dates.end }));
  }

  function editEnd(v: string) {
    dates.editEnd(v);
    push(customersHref({ start: dates.start, end: v }));
  }

  const visible = payload.customers.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.company ?? "").toLowerCase().includes(q) ||
      // Phone is no longer a column but is still matched here — an operator
      // with a number on a delivery note has nothing else to search by.
      (c.phone ?? "").includes(q)
    );
  });

  const ranged = Boolean(seed.start || seed.end);

  return (
    <div
      className={
        isPending ? "opacity-60 transition-opacity" : "transition-opacity"
      }
    >
      {/* Figma 1200×86 filter panel — the shared bar, previously on Inventory.
          `total` is the backend's whole-dataset count FOR THE ACTIVE WINDOW,
          not `payload.customers.length`: the rows are one capped scan, so
          counting them would understate the total on a large store. */}
      <DateFilterBar
        start={dates.start}
        end={dates.end}
        range={dates.range}
        onStart={editStart}
        onEnd={editEnd}
        onPreset={applyPreset}
        onClear={clearRange}
        showing={visible.length}
        total={payload.total_customers}
        noun="customers"
      />

      <Card className="mt-5">
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold leading-7 text-brand">
                Customers
              </h2>
              {/* Both figures are scoped by the active window server-side, so
                  the caption says which scope it is describing. Saying just
                  "N customers" under a 30-day filter would read as the whole
                  customer base. */}
              <p className="text-sm leading-5 text-muted">
                {nf.format(payload.total_customers)}{" "}
                {ranged ? "customers joined in this range" : "customers"} ·{" "}
                {nf.format(payload.registered_customers)} registered
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customers..."
                aria-label="Search customers"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {visible.length === 0 ? (
            <p className="border-t border-line py-12 text-center text-sm text-muted">
              No customers found
            </p>
          ) : (
            <Table bleed>
              {/* Figma: 40px header band filled rgba(196,188,176,0.3). */}
              <THead tinted>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Account</TH>
                  <TH>Company</TH>
                  <TH className="text-center">Orders</TH>
                </TR>
              </THead>
              <TBody>
                {visible.map((c) => (
                  <CustomerTableRow
                    key={c.id}
                    customer={c}
                    countsSampled={payload.counts_sampled}
                    onOpen={() => detail.open(c.id)}
                  />
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {ranged && (
        // The range scopes WHICH customers are listed (by when they joined),
        // never the Orders column — the backend deliberately keeps that a
        // lifetime count. Without this line the two would be indistinguishable
        // and "3" would read as "3 orders in the last 30 days".
        <p className="mt-4 text-center text-xs text-muted">
          Showing customers who joined in the selected range. The Orders column
          is each customer&rsquo;s lifetime total, not orders in this range.
        </p>
      )}
      {payload.truncated && (
        <p className="mt-4 text-center text-xs text-muted">
          Only the most recently added customers are shown — the true total
          may be higher.
        </p>
      )}
      {payload.counts_sampled && (
        // Edge case, not an error state — the order scan behind the Orders
        // column hit its cap, so figures marked "+" are a floor, not a
        // complete total. Kept as a footnote, same register as the line
        // above, rather than anything alarming.
        <p className="mt-1 text-center text-xs text-muted">
          Order counts marked &quot;+&quot; reflect only a recently scanned
          window of orders — the true count may be higher.
        </p>
      )}

      {detail.detailId && detail.detailState?.status === "loading" && (
        <Dialog open onClose={detail.close} title="Loading customer…">
          <p className="text-sm leading-5 text-muted">
            Fetching this customer&rsquo;s details and order history…
          </p>
        </Dialog>
      )}

      {detail.detailId && detail.detailState?.status === "error" && (
        <Dialog open onClose={detail.close} title="Couldn't load this customer">
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
        <CustomerDetailDialog
          detail={detail.detailState.customer}
          open
          onClose={detail.close}
        />
      )}
    </div>
  );
}

/**
 * One customer row. The whole row is clickable for the mouse, but the actual
 * control is the real `<button>` wrapping the name — that is what carries the
 * keyboard focus, the accessible name and the activation semantics.
 *
 * Deliberately NOT `role="button"` on the `<tr>`: that would strip the row
 * out of the table's semantics for screen readers, which is a worse trade
 * than the row simply not being a control in its own right.
 */
function CustomerTableRow({
  customer: c,
  countsSampled,
  onOpen,
}: {
  customer: CustomerRow;
  countsSampled: boolean;
  onOpen: () => void;
}) {
  return (
    <TR
      onClick={onOpen}
      className="cursor-pointer transition-colors hover:bg-[rgba(196,188,176,0.18)]"
    >
      <TD>
        <span className="flex items-center gap-3">
          <Avatar name={c.name} />
          <button
            type="button"
            // The row's own onClick already fires on the way up, so this must
            // not call it a second time — the button exists for keyboard and
            // assistive-tech users, and its click bubbles to the row.
            className="rounded-button text-left font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {c.name}
            <span className="sr-only"> — view customer details</span>
          </button>
        </span>
      </TD>
      <TD className="text-muted">{c.email ?? "—"}</TD>
      <TD>
        {/* Replaces the Phone column. Colour-coded — see `account-badge.tsx`
            for why this one badge diverges from the outline-only rule. */}
        <AccountBadge hasAccount={c.has_account} />
      </TD>
      <TD className={c.company ? "" : "text-muted"}>{c.company ?? "—"}</TD>
      {/* Figma: the order count is a brand-filled pill, not plain text. */}
      <TD className="text-center">
        <Badge tone="solid" className="tabular-nums">
          {fmtOrders(c.orders, countsSampled)}
        </Badge>
      </TD>
    </TR>
  );
}
