"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, Boxes, Package, Search } from "lucide-react";
import { DateFilterBar, type RangeKey } from "@/components/layout/date-filter-bar";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { useDateRange } from "@/lib/use-date-range";
import type { InventoryPayload, ProductRow } from "@/lib/data/inventory";

export type StockLevelFilter = "all" | "in-stock" | "low" | "out";
export type AlertFilter = "all" | "in-alert" | "no-threshold";

/**
 * Filtering acts on PRODUCT rows: a product matches when any of its variants
 * does. Expanding a matched product still shows ALL its variants — hiding
 * siblings would misrepresent the product's real stock position.
 */
export function filterProducts(
  products: ProductRow[],
  opts: {
    search: string;
    category: string;
    stockLevel: StockLevelFilter;
    alert: AlertFilter;
  },
): ProductRow[] {
  const q = opts.search.trim().toLowerCase();

  return products.filter((p) => {
    if (opts.category !== "all" && (p.category ?? "") !== opts.category) {
      return false;
    }

    if (q) {
      const hit =
        p.title.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        p.variants.some((v) => (v.sku ?? "").toLowerCase().includes(q));
      if (!hit) return false;
    }

    if (opts.stockLevel === "low" && !p.in_alert) return false;
    if (opts.stockLevel === "out" && p.available > 0) return false;
    if (opts.stockLevel === "in-stock" && (p.available <= 0 || p.in_alert)) {
      return false;
    }

    if (opts.alert === "in-alert" && !p.in_alert) return false;
    if (
      opts.alert === "no-threshold" &&
      !p.variants.some((v) => v.threshold === null)
    ) {
      return false;
    }

    return true;
  });
}

const nf = new Intl.NumberFormat("en-GH");

function StatCard({
  label,
  value,
  icon,
  tile,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tile: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.3px] text-muted uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand">
            {nf.format(value)}
          </p>
        </div>
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-button ${tile}`}
        >
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}

/**
 * What the server actually used for THIS payload: the fetched
 * `ordered_in_range` figures and the "Ordered in range"/"Ordered (all time)"
 * label both derive from this, never from the date bar's own live client
 * state — that's what keeps the label from ever describing a window the
 * data wasn't actually scoped to (see page.tsx's URL-is-the-source-of-truth
 * comment).
 */
export type InitialInventoryRange = {
  start: string;
  end: string;
  range: RangeKey;
  active: boolean;
};

/**
 * Inventory — Figma 3992:2915. No mobile frame exists for this screen (all 36
 * mobile-admin frames were checked); the shared Table component's own
 * `overflow-x-auto` wrapper is how narrow viewports are handled here, same as
 * Orders/Customers/Users.
 *
 * The page-level "Admin Dashboard" H1 already comes from the portal layout —
 * this screen starts directly with the filter bar, matching the Overview
 * screen's structure (KPI cards, no second heading).
 */
export function InventoryScreen({
  payload,
  initialRange,
}: {
  payload: InventoryPayload;
  initialRange: InitialInventoryRange;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  // Seeds the date bar's own interactive state from the EXACT window the
  // server just fetched — not a preset key the hook would have to re-derive
  // from "now". Re-deriving would drift on a reopened tab, a bookmark, a
  // shared link, or just a refresh after midnight: the fetch and label would
  // still describe the original window, but the two date inputs would show
  // a freshly-computed one, indefinitely, until someone touched the bar.
  // Passing the literal `initialRange` values instead means the inputs can
  // never disagree with what's actually on screen. The `range` key still
  // drives which preset chip lights up.
  const range = useDateRange({
    start: initialRange.start,
    end: initialRange.end,
    range: initialRange.range,
  });

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [stockLevel, setStockLevel] = React.useState<StockLevelFilter>("all");
  const [alert, setAlert] = React.useState<AlertFilter>("all");

  const categories = React.useMemo(
    () =>
      Array.from(
        new Set(payload.products.map((p) => p.category).filter(Boolean)),
      ).sort() as string[],
    [payload.products],
  );

  const visible = React.useMemo(
    () => filterProducts(payload.products, { search, category, stockLevel, alert }),
    [payload.products, search, category, stockLevel, alert],
  );

  // Skip the very first effect run: the server already fetched exactly what
  // the URL says, so re-issuing that same navigation would be a wasted round
  // trip. Every REAL change after that — a preset click or a hand-edited
  // date — pushes the new window into the URL, which re-runs the server
  // component and refetches `getInventory` scoped to it. This is a
  // navigation (an external system), not local setState, so it belongs in an
  // effect rather than during render.
  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const qs = new URLSearchParams();
    if (range.range) {
      // A preset chip: carry both the resolved dates and which chip it was.
      qs.set("start", range.start);
      qs.set("end", range.end);
      qs.set("range", range.range);
    } else if (range.start || range.end) {
      // A hand-edited date with no matching chip.
      if (range.start) qs.set("start", range.start);
      if (range.end) qs.set("end", range.end);
    } else {
      // Explicitly cleared — genuinely all-time, not "unspecified" (an empty
      // URL means "never chosen yet" server-side and would redirect back to
      // Last 30d, undoing the clear).
      qs.set("range", "all");
    }
    startTransition(() => {
      router.replace(`/inventory?${qs.toString()}`, { scroll: false });
    });
  }, [range.start, range.end, range.range, router]);

  return (
    <div className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <DateFilterBar
        start={range.start}
        end={range.end}
        range={range.range}
        onStart={range.editStart}
        onEnd={range.editEnd}
        onPreset={range.applyPreset}
        onClear={range.clearRange}
        showing={visible.length}
        total={payload.products.length}
        noun="products"
      />

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Products Tracked"
          value={payload.stats.products_tracked}
          icon={<Package className="size-4 text-[#282827]" aria-hidden />}
          tile="bg-[#e2e1e0]"
        />
        <StatCard
          label="Total Stock"
          value={payload.stats.total_stock}
          icon={<Boxes className="size-4 text-[#a49a87]" aria-hidden />}
          tile="bg-[rgba(164,154,135,0.2)]"
        />
        <StatCard
          label="Units Reserved"
          value={payload.stats.units_reserved}
          icon={<Package className="size-4 text-[#964022]" aria-hidden />}
          tile="bg-[rgba(150,64,34,0.2)]"
        />
        <StatCard
          label="Stock Alerts"
          value={payload.stats.stock_alerts}
          icon={<Bell className="size-4 text-[#f7f7f7]" aria-hidden />}
          tile="bg-[#282827]"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="pl-9"
          />
        </div>

        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Select
          value={stockLevel}
          onChange={(e) => setStockLevel(e.target.value as StockLevelFilter)}
          aria-label="Filter by stock level"
        >
          <option value="all">All Stock Levels</option>
          <option value="in-stock">In stock</option>
          <option value="low">Low</option>
          <option value="out">Out of stock</option>
        </Select>

        <Select
          value={alert}
          onChange={(e) => setAlert(e.target.value as AlertFilter)}
          aria-label="Filter by alert state"
        >
          <option value="all">All Alerts</option>
          <option value="in-alert">In alert</option>
          <option value="no-threshold">No threshold set</option>
        </Select>
      </div>

      <InventoryTable
        products={visible}
        rangeActive={initialRange.active}
        sampled={payload.stats.sampled === true}
      />

      <p className="mt-4 text-center text-xs text-muted">
        Available = Total Stock − Orders Used − Reserved · Stock alert fires at
        or below the threshold you set
      </p>
      {payload.stats.sampled && (
        // Edge case, not an error state — the order scan behind "Ordered"
        // hit its cap (ORDER_SCAN_CAP in the backend aggregate), so those
        // figures are a floor, not a complete total. Kept as a footnote,
        // same register as the line above, rather than anything alarming.
        <p className="mt-1 text-center text-xs text-muted">
          Figures marked &quot;+&quot; reflect only the most recently scanned
          orders in this window — the true total may be higher.
        </p>
      )}
    </div>
  );
}
