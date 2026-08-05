"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, ImagePlus, X } from "lucide-react";
import { FormAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  OptionsEditor,
  ROLE_ORDER,
  defaultTitle,
  newBlock,
  newValue,
  type OptionBlock,
  type OptionRole,
} from "@/components/products/options-editor";
import {
  createProduct,
  fetchProductForm,
  uploadProductImages,
  updateProduct,
} from "@/lib/actions/products";
import type { ProductFormPayload, VariantInput } from "@/lib/data/product-form";
import { validateProductImageFiles } from "@/lib/product-media";

/**
 * ProductCreator — Figma 3833:10813 (new) / 3833:13672 (edit), a 462px panel.
 *
 * ⚠ DELIBERATE DIVERGENCE FROM FIGMA (2026-08-02, client-approved).
 *
 * The frames price a product as `basePrice × size multiplier × material
 * multiplier × MOQ-tier multiplier`. The live catalog does not work that way:
 * `backend/src/scripts/import-catalog.ts` gives every VARIANT its own flat
 * price and writes `tiers: []` with the note "bulk-discount tiers removed
 * (never client-approved)" — they were deleted from the catalog on 2026-07-24.
 *
 * Building the multipliers as drawn would have resurrected a rejected pricing
 * model AND produced products this store cannot represent. So:
 *   - Size / Material / Print sections KEEP their Figma shape, minus the
 *     `priceMultiplier` field on each.
 *   - The MOQ Tiers section is replaced by a single "Minimum order quantity",
 *     which is what `metadata.moq` actually holds.
 *   - A Variants section is added: one row per option combination, carrying
 *     the SKU and the real GHS price. This is the catalog's actual model.
 *
 * ⚠ EDITING cannot restructure the option axes. Removing a size would destroy
 * its variants, their inventory items and any staff holds, and break live
 * carts — see the scope note on `backend/src/api/admin/pg/products/[id]/
 * route.ts`. Those controls are disabled when editing, and the form says why.
 */

/** Identity of a variant across axis edits — this is what lets an operator
 *  rename a material without losing every SKU and price already typed. */
const comboKey = (size: string, material: string, printing: string) =>
  JSON.stringify([size, material, printing]);

type VariantDraft = { sku: string; price: string };

export function ProductCreator({
  productId,
  categories,
  open,
  onClose,
  onSaved,
}: {
  /** null = create. */
  productId: string | null;
  categories: string[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = productId !== null;

  const [loading, setLoading] = React.useState(editing);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, startSaving] = React.useTransition();

  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState(categories[0] ?? "");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<"draft" | "published">("draft");
  const [moq, setMoq] = React.useState("1");
  const [features, setFeatures] = React.useState("");
  const [images, setImages] = React.useState<string[]>([]);
  const [thumbnail, setThumbnail] = React.useState<string | null>(null);
  // A new product starts with one Size option, the axis every product in this
  // catalog has. More are added by the operator.
  const [blocks, setBlocks] = React.useState<OptionBlock[]>(() => [
    newBlock("size", "Size"),
  ]);
  const [variants, setVariants] = React.useState<Record<string, VariantDraft>>({});

  // Load the product being edited.
  //
  // No `setLoading(true)` here: the parent gives this dialog a `key` per
  // product, so a different product REMOUNTS the form and `loading` starts
  // true from `useState(editing)` above. Setting it synchronously in the
  // effect body would be a cascading render for no gain (and eslint's
  // react-hooks/set-state-in-effect rejects it).
  React.useEffect(() => {
    if (!open || !editing) return;
    let cancelled = false;
    fetchProductForm(productId).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const f = result.form;
      setTitle(f.title);
      setCategory(f.category);
      setDescription(f.description ?? "");
      setStatus(f.status ?? "draft");
      setMoq(String(f.moq ?? 1));
      setFeatures((f.features ?? []).join("\n"));
      setImages(f.images ?? []);
      setThumbnail(f.thumbnail ?? f.images?.[0] ?? null);
      // Only axes the product actually has become blocks — a product with no
      // material choice must not open with an empty Material section inviting
      // someone to add one (which this route refuses anyway).
      const loaded: OptionBlock[] = [];
      if (f.sizes?.length) {
        loaded.push({
          ...newBlock("size", f.optionLabels?.size || defaultTitle("size")),
          values: f.sizes.map((s) => ({ ...newValue(), ...s })),
        });
      }
      if (f.materials?.length) {
        loaded.push({
          ...newBlock(
            "material",
            f.optionLabels?.material || defaultTitle("material"),
          ),
          values: f.materials.map((m) => ({ ...newValue(), ...m })),
        });
      }
      if (f.prints?.length) {
        loaded.push({
          ...newBlock("printing", defaultTitle("printing")),
          values: f.prints.map((pr) => ({ ...newValue(), ...pr })),
        });
      }
      setBlocks(loaded);
      setVariants(
        Object.fromEntries(
          (f.variants ?? []).map((v) => [
            comboKey(v.size, v.material ?? "", v.printing ?? ""),
            { sku: v.sku, price: String(v.price) },
          ]),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [open, editing, productId]);

  // The three axes in a FIXED order, whatever order the operator added them
  // in — the backend builds Medusa options in this same order, and a combo
  // key that disagreed would orphan every SKU and price already typed.
  const byRole = React.useMemo(() => {
    const map = {} as Record<OptionRole, string[]>;
    for (const role of ROLE_ORDER) {
      map[role] =
        blocks
          .find((b) => b.role === role)
          ?.values.map((v) => v.value.trim())
          .filter(Boolean) ?? [];
    }
    return map;
  }, [blocks]);

  const combos = React.useMemo(() => {
    const out: { key: string; size: string; material: string; printing: string }[] =
      [];
    for (const size of byRole.size.length ? byRole.size : [""]) {
      for (const material of byRole.material.length ? byRole.material : [""]) {
        for (const printing of byRole.printing.length ? byRole.printing : [""]) {
          // ⚠ Do NOT skip the all-empty combination. A product with no
          // options at all still has exactly one sellable variant —
          // Shredded Paper is one, sold per pack with neither size nor
          // material. Skipping it left an empty grid, so its real SKU and
          // price had nowhere to render and the form refused to save a
          // product it had just loaded.
          out.push({
            key: comboKey(size, material, printing),
            size,
            material,
            printing,
          });
        }
      }
    }
    return out;
  }, [byRole]);


  function setVariantField(key: string, field: keyof VariantDraft, value: string) {
    setVariants((prev) => {
      // A combination the operator hasn't touched yet has no entry at all —
      // seed it rather than spreading `undefined` into the row.
      const current: VariantDraft = prev[key] ?? { sku: "", price: "" };
      return { ...prev, [key]: { ...current, [field]: value } };
    });
  }

  /** Non-empty values of one axis, or [] when the product has no such axis. */
  function valuesOf(role: OptionRole) {
    return (
      blocks.find((b) => b.role === role)?.values.filter((v) => v.value.trim()) ??
      []
    );
  }

  function buildPayload(): ProductFormPayload {
    return {
      title: title.trim(),
      category,
      description: description.trim(),
      status,
      moq: Number(moq) || 1,
      features: features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      images,
      thumbnail,
      // The operator's own titles become the storefront's section headings
      // (metadata.option_labels); the Medusa option titles stay Size/Material/
      // Printing because that is what the storefront reads. See options-editor.
      optionLabels: {
        size: blocks.find((b) => b.role === "size")?.title.trim() || "Size",
        material:
          blocks.find((b) => b.role === "material")?.title.trim() || "Material",
      },
      sizes: valuesOf("size").map((v) => ({
        value: v.value.trim(),
        length: v.length ?? null,
        width: v.width ?? null,
        height: v.height ?? null,
        unit: v.unit ?? "mm",
      })),
      materials: valuesOf("material").map((v) => ({
        value: v.value.trim(),
        description: v.description ?? "",
      })),
      prints: valuesOf("printing").map((v) => ({
        value: v.value.trim(),
        description: v.description ?? "",
        setupFee: v.setupFee ?? 0,
        perUnit: v.perUnit ?? 0,
      })),
      variants: combos.map<VariantInput>((c) => ({
        size: c.size,
        material: c.material || null,
        printing: c.printing || null,
        sku: variants[c.key]?.sku?.trim() ?? "",
        price: Number(variants[c.key]?.price ?? 0),
      })),
    };
  }

  function selectImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    const validation = validateProductImageFiles(files);
    if (validation.length) {
      setError(validation[0]);
      return;
    }
    if (images.length + files.length > 8) {
      setError("A product can have no more than 8 images.");
      return;
    }

    setError(null);
    startSaving(async () => {
      const result = await uploadProductImages(files);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setImages((current) => {
        const next = [...current, ...result.urls];
        setThumbnail((currentThumbnail) => currentThumbnail ?? next[0] ?? null);
        return next;
      });
    });
  }

  function removeImage(url: string) {
    setImages((current) => {
      const next = current.filter((image) => image !== url);
      setThumbnail((currentThumbnail) =>
        currentThumbnail === url ? next[0] ?? null : currentThumbnail,
      );
      return next;
    });
  }

  function moveImage(url: string, direction: -1 | 1) {
    setImages((current) => {
      const index = current.indexOf(url);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function submit() {
    setError(null);
    const payload = buildPayload();
    startSaving(async () => {
      const result = editing
        ? await updateProduct(productId, payload)
        : await createProduct(payload);
      if (!result.ok) {
        // The backend validates the same rules again and returns the first
        // failure's own wording — show it rather than a generic "couldn't
        // save", which would leave the operator hunting for which field.
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  const busy = saving || loading;

  return (
    <Dialog
      open={open}
      onClose={busy ? () => {} : onClose}
      title={editing ? "Edit Product" : "Create New Product"}
      description={
        editing
          ? "Update this product's details, options and prices."
          : "Add a product to the catalog."
      }
      // Figma draws this panel at 462, which was fine for the frames' simple
      // multiplier fields. The real form carries a 4-up dimension grid per
      // size value and a SKU/price pair per variant, and those were cramped —
      // widened at the client's request (2026-08-02). `maxWidth` only, so
      // narrow viewports still shrink it.
      width={640}
      footer={
        <div className="flex flex-col gap-2">
          {error && <FormAlert>{error}</FormAlert>}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              {saving
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Create Product"}
            </Button>
          </div>
        </div>
      }
    >
      {loading ? (
        <p className="py-8 text-center text-sm text-muted">Loading product…</p>
      ) : (
        <>
          <Section title="Basic Information">
            <div className="flex flex-col gap-4">
              <Field id="prd-name" label="Product Name" required>
                <Input
                  id="prd-name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Standard Shipping Carton"
                />
              </Field>

              <Field id="prd-category" label="Category" required>
                <Select
                  id="prd-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.length === 0 && (
                    <option value="">No categories found</option>
                  )}
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field id="prd-desc" label="Description">
                <Textarea
                  id="prd-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the product..."
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field id="prd-status" label="Status">
                  <Select
                    id="prd-status"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as "draft" | "published")
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </Select>
                </Field>
                <Field id="prd-moq" label="Min. order qty">
                  <Input
                    id="prd-moq"
                    type="number"
                    min="1"
                    step="1"
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                  />
                </Field>
              </div>
              <p className="-mt-2 text-xs leading-4 text-muted">
                A draft is not visible in the storefront.
              </p>

              <Field id="prd-features" label="Features">
                <Textarea
                  id="prd-features"
                  rows={3}
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder={"One per line, e.g.\nFood-grade board\nRecyclable"}
                />
              </Field>

              <div className="flex flex-col gap-2">
                <Label>Product Images</Label>
                {/*
                  Genuinely disabled, not a stub that pretends. Medusa images
                  go through its file/upload provider, which this portal has
                  no route for yet — a button that opened a picker and threw
                  the file away is the defect `admin/CLAUDE.md` forbids.
                */}
                <button
                  type="button"
                  disabled
                  title="Image upload isn't wired yet — add images from the Medusa dashboard."
                  className="hidden"
                >
                  <ImagePlus className="size-5" aria-hidden />
                  <span className="text-xs leading-4">
                    Add images from the Medusa dashboard
                  </span>
                </button>
                <ProductMediaUploader
                  images={images}
                  thumbnail={thumbnail}
                  busy={busy}
                  onSelect={selectImages}
                  onSetThumbnail={setThumbnail}
                  onMove={moveImage}
                  onRemove={removeImage}
                />
              </div>
            </div>
          </Section>

          {editing && (
            <p className="mt-4 rounded-button border border-line bg-[rgba(196,188,176,0.3)] px-3 py-2 text-xs leading-4 text-muted">
              Option values can&apos;t be added or removed here — that would
              delete variants along with their stock and any open carts holding
              them. Do it in the Medusa dashboard. Labels, descriptions, SKUs
              and prices are all editable.
            </p>
          )}

          <OptionsEditor
            blocks={blocks}
            onChange={setBlocks}
            locked={editing}
          />

          {/* ── Variants ─────────────────────────────────────────────────── */}
          <section className="mt-6 border-t border-line pt-4">
            <h3 className="pb-1 text-sm font-semibold leading-5 text-brand">
              Variants &amp; Pricing
            </h3>
            <p className="pb-3 text-xs leading-4 text-muted">
              One row per option combination. Each carries its own SKU and GHS
              price — this catalog prices per variant, not by multiplier.
            </p>
            {combos.length === 0 ? (
              <p className="text-xs leading-4 text-muted">
                No variants yet — add an option value above.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {combos.map((c) => (
                  <div
                    key={c.key}
                    className="flex flex-col gap-2 rounded-button border border-line bg-background p-3"
                  >
                    <p className="text-xs font-semibold leading-4 text-muted">
                      {[c.size, c.material, c.printing]
                        .filter(Boolean)
                        .join(" / ") ||
                        "Single variant — this product has no options"}
                    </p>
                    <TwoUp>
                      <MiniField label="SKU">
                        <Input
                          value={variants[c.key]?.sku ?? ""}
                          placeholder="PG-XXX-000"
                          onChange={(e) =>
                            setVariantField(c.key, "sku", e.target.value)
                          }
                        />
                      </MiniField>
                      <MiniField label="Price (GH₵)">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={variants[c.key]?.price ?? ""}
                          placeholder="0.00"
                          onChange={(e) =>
                            setVariantField(c.key, "price", e.target.value)
                          }
                        />
                      </MiniField>
                    </TwoUp>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </Dialog>
  );
}

function ProductMediaUploader({
  images,
  thumbnail,
  busy,
  onSelect,
  onSetThumbnail,
  onMove,
  onRemove,
}: {
  images: string[];
  thumbnail: string | null;
  busy: boolean;
  onSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSetThumbnail: (url: string) => void;
  onMove: (url: string, direction: -1 | 1) => void;
  onRemove: (url: string) => void;
}) {
  return (
    <>
      <label
        htmlFor="prd-images"
        className="flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-button border border-dashed border-line bg-background text-muted transition-colors hover:bg-line/30"
      >
        <ImagePlus className="size-5" aria-hidden />
        <span className="text-xs leading-4">
          Add JPEG, PNG, WebP, or AVIF images
        </span>
        <input
          id="prd-images"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          disabled={busy}
          onChange={onSelect}
        />
      </label>
      <p className="text-xs leading-4 text-muted">
        Up to 8 images, 5 MB each. The selected thumbnail appears on product
        cards and receipts.
      </p>
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {images.map((url, index) => (
            <div
              key={url}
              className="relative overflow-hidden rounded-button border border-line bg-background"
            >
                        <Image
                          src={url}
                          alt={"Product image " + (index + 1)}
                          width={160}
                          height={160}
                          className="aspect-square w-full object-cover"
                        />
              <div className="flex items-center justify-between gap-1 p-1">
                <button
                  type="button"
                  onClick={() => onSetThumbnail(url)}
                  className="rounded px-1.5 py-1 text-xs font-medium text-brand hover:bg-line/30"
                  aria-pressed={thumbnail === url}
                >
                  {thumbnail === url ? "Thumbnail" : "Set cover"}
                </button>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => onMove(url, -1)}
                    disabled={index === 0}
                    aria-label={"Move image " + (index + 1) + " earlier"}
                    className="rounded p-1 hover:bg-line/30 disabled:opacity-30"
                  >
                    <ChevronUp className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(url, 1)}
                    disabled={index === images.length - 1}
                    aria-label={"Move image " + (index + 1) + " later"}
                    className="rounded p-1 hover:bg-line/30 disabled:opacity-30"
                  >
                    <ChevronDown className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(url)}
                    aria-label={"Remove image " + (index + 1)}
                    className="rounded p-1 text-destructive hover:bg-line/30"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="pb-3 text-sm font-semibold leading-5 text-brand">{title}</h3>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function TwoUp({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

function MiniField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium leading-4 text-muted">
        {label}
        {hint && <span className="ml-1 font-normal">{hint}</span>}
      </span>
      {children}
    </div>
  );
}
