"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { ProductCreator } from "@/components/products/product-creator";
import { FormAlert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { deleteProduct } from "@/lib/actions/products";
import { saveLevies } from "@/lib/actions/platform";
import type { Levies, PlatformPayload } from "@/lib/data/platform";
import type { ProductStatus, ProductsPayload } from "@/lib/data/products";

/**
 * Settings — Figma 3834:15852: Product Management list + Platform Settings.
 *
 * Both halves are LIVE as of 2026-08-02. Products read `GET /admin/products`
 * and write through `/admin/pg/products` (create, edit, delete); Platform
 * Settings reads and writes the Ghana tax region's levy split through
 * `/admin/pg/settings/platform`. Nothing on this screen is a fixture any more,
 * and `NOT_CONNECTED_MESSAGE` is gone from it.
 *
 * ⚠ Specs for this frame were NOT pulled (REST quota exhausted mid-pull);
 * geometry comes from the cached node tree. Parity pass still owed.
 */
export function SettingsScreen({
  productsResult,
  categories,
  platformResult,
}: {
  productsResult: { ok: true; payload: ProductsPayload } | { ok: false };
  /** Real category names — see `loadCategories` in the page. Empty means the
   *  lookup failed, which makes creating a product impossible; the button
   *  says so rather than opening a form that cannot be submitted. */
  categories: string[];
  platformResult: { ok: true; payload: PlatformPayload } | { ok: false };
}) {
  const router = useRouter();
  // `null` = closed. `{ id: null }` = create. `{ id }` = edit that product.
  const [editor, setEditor] = React.useState<{ id: string | null } | null>(null);
  const [deleting, setDeleting] = React.useState<{
    id: string;
    title: string;
  } | null>(null);

  const onEdit = React.useCallback((id: string) => setEditor({ id }), []);

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
                {/* "Published" said out loud so this can't silently disagree
                    with Overview's Active Products card, which counts the
                    same scope (see lib/data/products.ts). */}
                {productsResult.ok
                  ? catalogSummary(
                      productsResult.payload.count,
                      productsResult.payload.draftCount,
                    )
                  : "Manage your product catalog"}
              </p>
            </div>
            <Button
              onClick={() => setEditor({ id: null })}
              disabled={categories.length === 0}
              title={
                categories.length === 0
                  ? "Categories could not be loaded — a product needs one."
                  : undefined
              }
            >
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

                    {/*
                      Figma 3834:15852 puts an Edit control here. Pricing used
                      to sit in this slot; it was removed at the client's
                      request (2026-08-02) because a "From GH₵…" figure that is
                      the MINIMUM of several variant prices reads as the
                      product's price, and every one of them is still a
                      placeholder. The real prices are per-variant and belong
                      in the editor, which is now one click away.
                    */}
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={p.status} />
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onEdit(p.id)}
                        aria-label={`Edit ${p.title}`}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                        Edit
                      </Button>
                      {/* Delete is destructive and irreversible, so it is an
                          icon-only secondary action that opens a confirmation
                          spelling out what is lost — never a one-click button
                          sitting next to the one people mean to press. */}
                      <button
                        type="button"
                        onClick={() =>
                          setDeleting({ id: p.id, title: p.title })
                        }
                        aria-label={`Delete ${p.title}`}
                        className="inline-flex size-7 items-center justify-center rounded-button text-muted transition-colors hover:bg-line/40 hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
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

      <PlatformSettingsCard result={platformResult} />

      {deleting && (
        <DeleteProductDialog
          product={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            router.refresh();
          }}
        />
      )}

      {editor && (
        <ProductCreator
          // Remounts when switching between products so the form never shows
          // the previously-opened product's values while the new one loads.
          key={editor.id ?? "new"}
          productId={editor.id}
          categories={categories}
          open
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

/**
 * Names BOTH scopes when drafts exist. Overview's "Active Products" card
 * counts published only, so a bare total here would silently disagree with it
 * — `lib/data/products.ts` widened this list to every status and requires the
 * gap be stated rather than left to be discovered.
 */
function catalogSummary(count: number, drafts: number): string {
  const products = `${count} product${count === 1 ? "" : "s"} in the catalog`;
  return drafts > 0 ? `${products} · ${drafts} draft` : products;
}

/**
 * Draft vs published. Outline, per the admin's badge rule — state is carried
 * by the label, never by fill colour (see `ui/badge.tsx`). Published is the
 * unremarkable case and gets muted treatment; a draft is the one an operator
 * needs to notice, because it is invisible to customers.
 */
function StatusBadge({ status }: { status: ProductStatus }) {
  if (status === "published") {
    return <span className="text-xs leading-4 text-muted">Published</span>;
  }
  return (
    <Badge className="capitalize" title="Not visible in the storefront">
      {status}
    </Badge>
  );
}

/**
 * Platform Settings — the Ghana tax configuration, live against
 * `GET|POST /admin/pg/settings/platform`.
 *
 * ⚠ THE THREE LEVIES ARE ONE NUMBER TO MEDUSA. It charges a single rate per
 * tax region; VAT / NHIL / GETFund are how that rate is itemised on an
 * invoice. So this form edits three fields and saves their SUM as the charged
 * rate, storing the split beside it. There is no separate "effective rate"
 * input because it is derived — shown live as you type.
 *
 * Currency and delivery are READ-ONLY here and say why: currency is baked into
 * every stored price, and shipping option prices carry region and currency
 * rules that belong in Medusa's own editor.
 */
function PlatformSettingsCard({
  result,
}: {
  result: { ok: true; payload: PlatformPayload } | { ok: false };
}) {
  const router = useRouter();
  const [saving, startSaving] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [draft, setDraft] = React.useState<Levies | null>(
    result.ok ? result.payload.levies : null,
  );

  if (!result.ok || !draft) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-0">
          <h2 className="text-lg font-semibold leading-7 text-brand">
            Platform Settings
          </h2>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Never render editable tax fields on a failed load — a rate shown
              from a default would invite someone to "confirm" a number the
              store isn't actually charging. */}
          <div className="rounded-panel border border-line bg-surface p-8 text-center">
            <p className="text-base font-semibold text-brand">
              Tax settings are unavailable
            </p>
            <p className="mt-1 text-sm text-muted">
              Could not reach the commerce backend. Rates are deliberately not
              shown rather than guessed. Reload once it is reachable.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const payload = result.payload;
  const dirty =
    draft.vat !== payload.levies.vat ||
    draft.nhil !== payload.levies.nhil ||
    draft.getfund !== payload.levies.getfund;

  // ⚠ Save must also be available when NOTHING has been edited but the stored
  // split doesn't reconcile with the charged rate. That is the live 21.9%-vs-20
  // case: the fix is to write the split as-is, which sets the charged rate to
  // their sum. Gating purely on `dirty` produced a banner instructing the
  // operator to save next to a disabled Save button.
  const canSave = dirty || !payload.reconciliation.ok;

  const set = (key: keyof Levies, value: number) => {
    setSaved(false);
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  };

  function save() {
    if (!draft) return;
    setError(null);
    startSaving(async () => {
      const res = await saveLevies(draft);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-0">
        <h2 className="text-lg font-semibold leading-7 text-brand">
          Platform Settings
        </h2>
        <p className="text-sm leading-5 text-muted">
          Ghana tax rates, currency and delivery
        </p>
      </CardHeader>

      <CardContent className="pt-6">
        {/*
          The live discrepancy, stated rather than hidden: the region was
          seeded at 21.9% (the pre-Act-1151 cascading rate) and carries no
          stored split, so orders are charged 21.9 while invoices itemise 20.
          Saving reconciles the two.
        */}
        {!payload.reconciliation.ok && (
          <div className="mb-4 rounded-button border border-[rgba(251,44,54,0.4)] bg-[rgba(231,0,11,0.06)] px-4 py-3 text-xs leading-4 text-brand">
            <span className="font-semibold text-destructive">
              Charged rate and levy split disagree.
            </span>{" "}
            Orders are charged{" "}
            <strong>{payload.reconciliation.chargedRate}%</strong>, but these
            levies add up to{" "}
            <strong>{payload.reconciliation.levyTotal}%</strong> — so invoices
            itemise a different total from the one collected. Saving sets the
            charged rate to the sum of the three below.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberField
            id="set-vat"
            label="VAT (%)"
            value={draft.vat}
            onChange={(v) => set("vat", v)}
          />
          <NumberField
            id="set-nhil"
            label="NHIL (%)"
            value={draft.nhil}
            onChange={(v) => set("nhil", v)}
          />
          <NumberField
            id="set-getfund"
            label="GETFund (%)"
            value={draft.getfund}
            onChange={(v) => set("getfund", v)}
          />
        </div>


        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Currency" value={payload.currency_code}>
            Baked into every stored price — changing it here would relabel
            prices without converting them.
          </ReadOnlyField>
          <ReadOnlyField
            label="Delivery"
            value={
              payload.shipping_options.length === 1
                ? payload.shipping_options[0].name
                : `${payload.shipping_options.length} shipping options`
            }
          >
            Option prices carry region and currency rules — edit them under
            Locations &amp; Shipping in the Medusa dashboard.
          </ReadOnlyField>
        </div>

        {error && (
          <div className="mt-4">
            <FormAlert>{error}</FormAlert>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={saving || !canSave}>
            {saving ? "Saving…" : "Save Settings"}
          </Button>
          {/* Shown only after a save that actually returned ok — never as
              decoration on a form that changed nothing. */}
          {saved && !dirty && (
            <span className="text-sm leading-5 text-muted">
              Saved — orders are now charged {payload.effective_rate}%.
            </span>
          )}
          {dirty && !saving && (
            <span className="text-sm leading-5 text-muted">
              Unsaved changes.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


/**
 * Deleting a product is irreversible and takes more with it than the row
 * suggests, so the confirmation states exactly what survives and what does
 * not. Kept open on failure, showing the backend's own refusal.
 */
function DeleteProductDialog({
  product,
  onClose,
  onDeleted,
}: {
  product: { id: string; title: string };
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, startDeleting] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <Dialog
      open
      onClose={busy ? () => {} : onClose}
      title={`Delete ${product.title}?`}
      description="This cannot be undone."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setError(null);
              startDeleting(async () => {
                const res = await deleteProduct(product.id);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                onDeleted();
              });
            }}
            disabled={busy}
          >
            {busy ? "Deleting…" : "Delete product"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 text-sm leading-5 text-brand">
        <p>
          Past orders are unaffected — order lines keep their own copy of the
          title, price and options, so history, invoices and emails still
          render correctly.
        </p>
        <p>
          <strong>Deleted with it:</strong> every variant, their inventory
          items, all stocked quantities and any staff holds. Customers with
          this product in an open cart will find it gone.
        </p>
        <p className="text-muted">
          To hide it from the storefront instead, set its status to Draft in
          Edit.
        </p>
        {error && <FormAlert>{error}</FormAlert>}
      </div>
    </Dialog>
  );
}

function ReadOnlyField({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <p className="flex h-9 items-center rounded-button border border-line bg-[rgba(196,188,176,0.2)] px-3 text-sm text-muted">
        {value}
      </p>
      <p className="text-xs leading-4 text-muted">{children}</p>
    </div>
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
        max="100"
        step="0.01"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
