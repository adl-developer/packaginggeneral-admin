"use client";

import * as React from "react";
import { Bell, BellOff, ChevronDown, ChevronRight, Package, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import {
  StockDialogs,
  type DialogRequest,
} from "@/components/inventory/stock-dialogs";
import type { ProductRow, VariantRow } from "@/lib/data/inventory";

const nf = new Intl.NumberFormat("en-GH");

/** Bell + "at N", or a muted "—" when no threshold is set. */
function AlertCell({
  threshold,
  mixed,
  inAlert,
}: {
  threshold: number | null;
  mixed?: boolean;
  inAlert: boolean;
}) {
  if (mixed) {
    return <span className="text-xs text-muted">Mixed</span>;
  }
  if (threshold === null) {
    return (
      <span className="inline-flex flex-col items-center gap-0.5 text-muted">
        <BellOff className="size-4" aria-hidden />
        <span className="text-xs">—</span>
      </span>
    );
  }
  return (
    <span
      className={`inline-flex flex-col items-center gap-0.5 ${
        inAlert ? "text-[#964022]" : "text-muted"
      }`}
    >
      <Bell className="size-4" aria-hidden />
      <span className="text-xs">at {nf.format(threshold)}</span>
    </span>
  );
}

export function InventoryTable({
  products,
  rangeActive,
}: {
  products: ProductRow[];
  rangeActive: boolean;
}) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [request, setRequest] = React.useState<DialogRequest | null>(null);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <Card className="mt-5">
        <CardHeader>
          <h2 className="flex items-center gap-2 text-lg font-semibold leading-7 text-brand">
            <Package className="size-4 text-muted" aria-hidden />
            Product Inventory
          </h2>
        </CardHeader>

        <CardContent>
          {products.length === 0 ? (
            <p className="border-t border-line py-12 text-center text-sm text-muted">
              No products match these filters
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Product</TH>
                  <TH className="text-center">Total Stock</TH>
                  <TH className="text-center">Orders Used</TH>
                  <TH className="text-center">
                    {rangeActive ? "Ordered in range" : "Ordered (all time)"}
                  </TH>
                  <TH className="text-center">Reserved</TH>
                  <TH className="text-center">Available</TH>
                  <TH className="text-center">Alert</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {products.map((p) => {
                  const open = expanded.has(p.id);
                  return (
                    <React.Fragment key={p.id}>
                      <TR>
                        <TD>
                          <button
                            type="button"
                            onClick={() => toggle(p.id)}
                            aria-expanded={open}
                            className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                          >
                            {open ? (
                              <ChevronDown className="size-4 shrink-0 text-muted" aria-hidden />
                            ) : (
                              <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                            )}
                            <span className="flex flex-col">
                              <span className="font-medium text-brand">{p.title}</span>
                              <span className="text-xs text-muted">
                                {p.category ?? "—"} · {p.variants.length}{" "}
                                {p.variants.length === 1 ? "variant" : "variants"}
                              </span>
                            </span>
                          </button>
                        </TD>
                        <TD className="text-center tabular-nums">{nf.format(p.total_stock)}</TD>
                        <TD className="text-center tabular-nums">{nf.format(p.orders_used)}</TD>
                        <TD className="text-center tabular-nums">{nf.format(p.ordered_in_range)}</TD>
                        <TD className="text-center tabular-nums">{nf.format(p.reserved)}</TD>
                        <TD className="text-center font-medium tabular-nums">
                          {nf.format(p.available)}
                        </TD>
                        <TD className="text-center">
                          <AlertCell
                            threshold={p.threshold}
                            mixed={p.threshold_mixed}
                            inAlert={p.in_alert}
                          />
                        </TD>
                        <TD className="text-right">
                          {/* Stock lives on variants, so the product row only
                              offers the bulk threshold edit. */}
                          <Button
                            variant="ghost"
                            size="xs"
                            aria-label={`Set alert threshold for every variant of ${p.title}`}
                            onClick={() =>
                              setRequest({
                                kind: "threshold",
                                scope: "product",
                                id: p.id,
                                label: p.title,
                                current: p.threshold,
                              })
                            }
                          >
                            <Pencil className="size-4" aria-hidden />
                          </Button>
                        </TD>
                      </TR>

                      {open &&
                        p.variants.map((v: VariantRow) => (
                          <TR key={v.id} className="bg-[rgba(196,188,176,0.15)]">
                            <TD className="pl-10">
                              <span className="flex flex-col">
                                <span className="text-sm text-brand">{v.title}</span>
                                <span className="text-xs text-muted">
                                  {v.sku ?? "no SKU"}
                                  {v.staff_reservations.length > 0 &&
                                    ` · ${v.staff_reservations.length} hold${
                                      v.staff_reservations.length === 1 ? "" : "s"
                                    }`}
                                </span>
                              </span>
                            </TD>
                            <TD className="text-center tabular-nums">{nf.format(v.total_stock)}</TD>
                            <TD className="text-center tabular-nums">{nf.format(v.orders_used)}</TD>
                            <TD className="text-center tabular-nums">
                              {nf.format(v.ordered_in_range)}
                            </TD>
                            <TD className="text-center tabular-nums">{nf.format(v.reserved)}</TD>
                            <TD className="text-center font-medium tabular-nums">
                              {nf.format(v.available)}
                            </TD>
                            <TD className="text-center">
                              <AlertCell threshold={v.threshold} inAlert={v.in_alert} />
                            </TD>
                            <TD>
                              <span className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() =>
                                    setRequest({
                                      kind: "add-stock",
                                      id: v.id,
                                      label: `${p.title} — ${v.title}`,
                                      current: v.total_stock,
                                    })
                                  }
                                >
                                  Add Stock
                                </Button>
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() =>
                                    setRequest({
                                      kind: "reserve",
                                      id: v.id,
                                      label: `${p.title} — ${v.title}`,
                                      available: v.available,
                                      reservations: v.staff_reservations,
                                    })
                                  }
                                >
                                  Reserve
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  aria-label={`Set alert threshold for ${v.title}`}
                                  onClick={() =>
                                    setRequest({
                                      kind: "threshold",
                                      scope: "variant",
                                      id: v.id,
                                      label: `${p.title} — ${v.title}`,
                                      current: v.threshold,
                                    })
                                  }
                                >
                                  <Pencil className="size-4" aria-hidden />
                                </Button>
                              </span>
                            </TD>
                          </TR>
                        ))}
                    </React.Fragment>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <StockDialogs request={request} onClose={() => setRequest(null)} />
    </>
  );
}
