"use client";

import * as React from "react";
import { Bell, Boxes, Package, Search } from "lucide-react";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
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
 * Inventory — Figma 3992:2915. No mobile frame exists for this screen (all 36
 * mobile-admin frames were checked); the shared Table component's own
 * `overflow-x-auto` wrapper is how narrow viewports are handled here, same as
 * Orders/Customers/Users.
 *
 * The page-level "Admin Dashboard" H1 already comes from the portal layout —
 * this screen starts directly with the KPI cards, matching the Overview
 * screen's structure (no second heading).
 *
 * ⚠ The date-range bar and the "Ordered in range" column were REMOVED on
 * 2026-08-02 at the client's request. They were a pair: the bar existed only
 * to scope that column, so neither is useful without the other. The backend
 * still supports the window — `GET /admin/pg/inventory` accepts start/end and
 * `aggregate.ts` still computes `ordered_in_range` — it is simply no longer
 * requested (see `lib/data/inventory.ts`). Re-enabling is a UI change plus
 * dropping the `ordered=none` param, not a backend rewrite.
 */
export function InventoryScreen({ payload }: { payload: InventoryPayload }) {

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

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/*
        Figma `Container 1200x60 pad=24/0/0/0 LAY=HORIZONTAL gap=12`: one row of
        Input 652 · Button 176 · Button 176 · Button 160. 652 + 3×12 + 512 =
        1200 exactly, so the three selects are FIXED at their Figma widths and
        the search box takes whatever is left — that arithmetic is what makes
        the row land on a single line at the design's 1200px content width.

        Previously every Select inherited the shared `w-full`, which inside a
        flex row resolves against the ROW, so each one claimed the full width
        and the group wrapped onto three lines well before it needed to.
        `shrink-0` keeps them at their Figma size instead of being squeezed
        thinner as the search box grows; `flex-wrap` is what still stacks them
        cleanly below 1200 rather than overflowing (no mobile frame exists for
        this screen — see the component doc above).
      */}
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
          className="w-44 shrink-0"
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
          className="w-44 shrink-0"
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
          className="w-40 shrink-0"
        >
          <option value="all">All Alerts</option>
          <option value="in-alert">In alert</option>
          <option value="no-threshold">No threshold set</option>
        </Select>
      </div>

      {/*
        The "N of M products" count used to live at the right of the date bar.
        That bar is gone, but the count is not decoration — with four filters
        above it, an operator has to be able to tell "no results" apart from
        "one result". It now sits in the table card's own header, opposite the
        title, so it reads as a caption for the list it counts. `total` is the
        UNFILTERED product count, which is why it comes from the payload here
        rather than from the rows the table was handed.
      */}
      <InventoryTable products={visible} total={payload.products.length} />

      <p className="mt-4 text-center text-xs text-muted">
        Available = Total Stock − Orders Used − Reserved · Stock alert fires at
        or below the threshold you set
      </p>
      {/*
        No "+" sampling footnote here any more. It existed solely to caveat the
        removed "Ordered" column — `payload.stats.sampled` describes that
        column's order scan and nothing else on this screen, so keeping the
        note would caveat figures that are no longer shown.
      */}
    </div>
  );
}
