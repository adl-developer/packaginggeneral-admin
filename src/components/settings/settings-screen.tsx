"use client";

import * as React from "react";
import { Package, Plus } from "lucide-react";
import { ProductCreator } from "@/components/products/product-creator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import type { ProductsPayload } from "@/lib/data/products";
import type { PlatformSettings } from "@/lib/data/types";
import { formatCedis } from "@/lib/utils";

/**
 * Settings — Figma 3834:15852: Product Management list + Platform Settings.
 *
 * Task 17 (2026-08-01): Product Management is now LIVE (`GET
 * /admin/products` via `lib/data/products.ts`). Platform Settings stays on
 * fixtures — VAT/NHIL/GETFund/fees have no backend persistence at all yet
 * (Spec 2). Both the Platform Settings form and the ProductCreator's save
 * control are explicitly labelled "not connected" and their submit controls
 * disabled, so nobody edits a value here and believes it took effect.
 *
 * ⚠ Specs for this frame were NOT pulled (REST quota exhausted mid-pull);
 * geometry comes from the cached node tree. Parity pass still owed.
 */
export function SettingsScreen({
  productsResult,
  platformSettings,
}: {
  productsResult: { ok: true; payload: ProductsPayload } | { ok: false };
  platformSettings: PlatformSettings;
}) {
  const [creating, setCreating] = React.useState(false);

  return (
    <>
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold leading-7 text-brand">
                Product Management
              </h2>
              <p className="text-sm leading-5 text-muted">
                {productsResult.ok
                  ? `${productsResult.payload.count} product${
                      productsResult.payload.count === 1 ? "" : "s"
                    } in the catalog`
                  : "Manage your product catalog"}
              </p>
            </div>
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" aria-hidden />
              Add New Product
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {!productsResult.ok ? (
            // Never render an empty list on failure — "no products" and "we
            // couldn't load products" must not look the same.
            <div className="rounded-panel border border-line bg-surface p-8 text-center">
              <p className="text-base font-semibold text-brand">
                Products are unavailable
              </p>
              <p className="mt-1 text-sm text-muted">
                Could not reach the commerce backend. The catalog is
                deliberately not shown rather than guessed. Reload once the
                backend is reachable.
              </p>
            </div>
          ) : productsResult.payload.products.length === 0 ? (
            <p className="border-t border-line py-12 text-center text-sm text-muted">
              No products in the catalog
            </p>
          ) : (
            <>
              <ul className="flex flex-col">
                {productsResult.payload.products.map((p, i, arr) => (
                  <li
                    key={p.id}
                    className={
                      i === arr.length - 1
                        ? "flex items-center justify-between gap-4 py-3"
                        : "flex items-center justify-between gap-4 border-b border-line py-3 first:pt-0"
                    }
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      {p.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element -- product image host is not a fixed, configurable domain
                        <img
                          src={p.thumbnail}
                          alt=""
                          className="size-12 shrink-0 rounded-button border border-line object-cover"
                        />
                      ) : (
                        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-button bg-line">
                          <Package className="size-5 text-muted" aria-hidden />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-base leading-6 font-medium text-brand">
                          {p.title}
                        </span>
                        <span className="block text-sm leading-5 text-muted">
                          {p.category ?? "Uncategorized"} · {p.variantCount}{" "}
                          variant{p.variantCount === 1 ? "" : "s"}
                        </span>
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      {p.startsAt === null ? (
                        <span className="text-sm leading-5 text-muted">
                          Price unavailable
                        </span>
                      ) : (
                        <>
                          <span className="block text-sm leading-5 font-medium text-brand">
                            From {formatCedis(p.startsAt)}
                          </span>
                          {p.pricingPlaceholder && (
                            <Badge className="mt-1">
                              Placeholder — not final
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {productsResult.payload.truncated && (
                <p className="mt-4 text-center text-xs text-muted">
                  Only the first {productsResult.payload.products.length}{" "}
                  products are shown — the catalog has more.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <PlatformSettingsCard settings={platformSettings} />

      {creating && (
        <ProductCreator product={null} open onClose={() => setCreating(false)} />
      )}
    </>
  );
}

const NOT_CONNECTED_MESSAGE = "Not yet connected — changes are not saved.";

function PlatformSettingsCard({ settings }: { settings: PlatformSettings }) {
  const [draft, setDraft] = React.useState(settings);

  const set = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  // Ghana 2026 reform (Act 1151): the three levies apply to the same base with
  // no cascading, so the effective rate is their straight sum.
  const effectiveVat = draft.vatRate + draft.nhilRate + draft.getfundRate;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-0">
        <h2 className="text-lg font-semibold leading-7 text-brand">
          Platform Settings
        </h2>
        <p className="text-sm leading-5 text-muted">
          Configure currency, platform fees, and tax rates
        </p>
      </CardHeader>

      <CardContent className="pt-6">
        <p className="mb-4 rounded-button border border-[rgba(150,64,34,0.4)] bg-[rgba(150,64,34,0.08)] px-4 py-3 text-xs leading-4 font-medium text-brand">
          {NOT_CONNECTED_MESSAGE} These fields have no backend persistence
          yet — VAT/NHIL/GETFund and fee changes here do not reach the
          storefront or any order.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="set-currency">Currency</Label>
            <Select
              id="set-currency"
              value={draft.currency}
              onChange={(e) => set("currency", e.target.value)}
            >
              <option value="GHS">GHS — Ghanaian Cedi</option>
              <option value="USD">USD — US Dollar</option>
            </Select>
          </div>

          <NumberField
            id="set-vat"
            label="VAT Rate (%)"
            value={draft.vatRate}
            onChange={(v) => set("vatRate", v)}
          />
          <NumberField
            id="set-nhil"
            label="NHIL Rate (%)"
            value={draft.nhilRate}
            onChange={(v) => set("nhilRate", v)}
          />
          <NumberField
            id="set-getfund"
            label="GetFund Rate (%)"
            value={draft.getfundRate}
            onChange={(v) => set("getfundRate", v)}
          />
          <NumberField
            id="set-fee"
            label="Platform Fee (%)"
            value={draft.platformFeePct}
            onChange={(v) => set("platformFeePct", v)}
          />
          <NumberField
            id="set-delivery"
            label="Base Delivery Fee"
            value={draft.baseDeliveryFee}
            onChange={(v) => set("baseDeliveryFee", v)}
          />
        </div>

        <p className="mt-4 rounded-button border border-line bg-[rgba(196,188,176,0.3)] px-4 py-3 text-xs leading-4 text-muted">
          Effective tax rate:{" "}
          <span className="font-semibold text-brand">
            {effectiveVat.toFixed(1)}%
          </span>{" "}
          (VAT + NHIL + GETFund, no cascading — Ghana VAT reform, Act 1151,
          effective 1 Jan 2026).
        </p>

        <div className="mt-5 flex items-center gap-3">
          <Button disabled title={NOT_CONNECTED_MESSAGE}>
            Save Settings
          </Button>
          <span className="text-sm leading-5 text-muted">
            {NOT_CONNECTED_MESSAGE}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min="0"
        step="0.1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
