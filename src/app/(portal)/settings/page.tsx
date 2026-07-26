"use client";

import * as React from "react";
import { Package, Pencil, Plus } from "lucide-react";
import { ProductCreator } from "@/components/products/product-creator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import type { PlatformSettings, Product } from "@/lib/data/types";
import { useAdmin } from "@/lib/store";
import { formatCedis } from "@/lib/utils";

/**
 * Settings — Figma 3834:15852: Product Management list + Platform Settings.
 *
 * ⚠ Specs for this frame were NOT pulled (REST quota exhausted mid-pull);
 * geometry comes from the cached node tree. Parity pass still owed.
 */
export default function SettingsPage() {
  const { products, upsertProduct, settings, saveSettings } = useAdmin();
  const [editing, setEditing] = React.useState<Product | null>(null);
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
                Manage your product catalog
              </p>
            </div>
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" aria-hidden />
              Add New Product
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <ul className="flex flex-col">
            {products.map((p, i) => (
              <li
                key={p.id}
                className={
                  i === products.length - 1
                    ? "flex items-center justify-between gap-4 py-3"
                    : "flex items-center justify-between gap-4 border-b border-line py-3 first:pt-0"
                }
              >
                {/* Figma: 48×48 #c4bcb0 tile, radius 14, 20px muted package glyph. */}
                <div className="flex min-w-0 items-center gap-4">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-button bg-line">
                    <Package className="size-5 text-muted" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-base leading-6 font-medium text-brand">
                      {p.name}
                    </span>
                    <span className="block text-sm leading-5 text-muted">
                      Base price: {formatCedis(p.basePrice)} · {p.categorySlug}
                    </span>
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(p)}
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Edit
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <PlatformSettingsCard settings={settings} onSave={saveSettings} />

      {(editing || creating) && (
        <ProductCreator
          product={editing}
          open
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(p) => {
            upsertProduct(p);
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </>
  );
}

function PlatformSettingsCard({
  settings,
  onSave,
}: {
  settings: PlatformSettings;
  onSave: (s: PlatformSettings) => void;
}) {
  const [draft, setDraft] = React.useState(settings);
  const [saved, setSaved] = React.useState(false);

  const set = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

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
          <Button
            disabled={!dirty}
            onClick={() => {
              onSave(draft);
              setSaved(true);
            }}
          >
            Save Settings
          </Button>
          {saved && !dirty && (
            <span className="text-sm leading-5 text-muted">Saved</span>
          )}
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
