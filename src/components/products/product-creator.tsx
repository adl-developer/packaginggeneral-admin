"use client";

import * as React from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { PRODUCT_CATEGORIES } from "@/lib/data/mock";
import { NOT_CONNECTED_MESSAGE } from "@/lib/not-connected";
import type {
  MaterialOption,
  MoqTier,
  PrintOption,
  Product,
  SizeOption,
} from "@/lib/data/types";

/**
 * ProductCreator — Figma 3833:10813 (new) / 3833:13672 (edit), a 462px panel.
 *
 * Sections: Basic Information → Size Options → Material Options →
 * Print Options → MOQ Tiers. Every option section is repeatable with an
 * "Add …" control, exactly as designed.
 *
 * ⚠ Specs for these two frames were NOT pulled (REST quota exhausted mid-pull);
 * geometry comes from the cached node tree. Re-run the pull script and do a
 * parity pass.
 *
 * Task 17 (2026-08-01): writing real products is Spec 2 (blocked on the
 * client's MOQ-tier answer — see `docs/superpowers/specs/2026-07-31-admin-
 * medusa-wiring-design.md` §10). The save control below is therefore always
 * disabled and labelled, so a manager filling this form out cannot come away
 * believing a product was created.
 */
const uid = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

const emptySize = (): SizeOption => ({
  id: uid("size"),
  label: "",
  priceMultiplier: 1,
  length: 0,
  width: 0,
  height: 0,
  unit: "cm",
});

const emptyMaterial = (): MaterialOption => ({
  id: uid("mat"),
  label: "",
  priceMultiplier: 1,
  description: "",
});

const emptyPrint = (): PrintOption => ({
  id: uid("print"),
  label: "",
  setupFee: 0,
  pricePerUnit: 0,
  description: "",
});

const emptyTier = (): MoqTier => ({
  id: uid("tier"),
  label: "",
  minQuantity: 50,
  maxQuantity: null,
  priceMultiplier: 1,
});

export function ProductCreator({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  const editing = Boolean(product);

  const [name, setName] = React.useState(product?.name ?? "");
  const [category, setCategory] = React.useState(
    product?.categorySlug ?? PRODUCT_CATEGORIES[0].slug,
  );
  const [description, setDescription] = React.useState(
    product?.description ?? "",
  );
  const [basePrice, setBasePrice] = React.useState(
    product ? String(product.basePrice) : "",
  );
  const [sizes, setSizes] = React.useState<SizeOption[]>(
    product?.sizes ?? [emptySize()],
  );
  const [materials, setMaterials] = React.useState<MaterialOption[]>(
    product?.materials ?? [emptyMaterial()],
  );
  const [prints, setPrints] = React.useState<PrintOption[]>(
    product?.prints ?? [emptyPrint()],
  );
  const [tiers, setTiers] = React.useState<MoqTier[]>(
    product?.tiers ?? [emptyTier()],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit Product" : "Create New Product"}
      description={
        editing
          ? "Update this product's options and pricing."
          : "Add a product to the catalog."
      }
      width={462}
      footer={
        <div className="flex flex-col gap-2">
          <p className="text-xs leading-4 text-destructive">
            {NOT_CONNECTED_MESSAGE} Writing real products is not built yet.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled title={NOT_CONNECTED_MESSAGE}>
              {editing ? "Save changes" : "Create Product"}
            </Button>
          </div>
        </div>
      }
    >
      <Section title="Basic Information">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="prd-name">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="prd-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Shipping Carton"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="prd-category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              id="prd-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="prd-desc">Description</Label>
            <Textarea
              id="prd-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Product Image</Label>
            <button
              type="button"
              className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-button border border-dashed border-line bg-background text-muted transition-colors hover:bg-line/30"
            >
              <ImagePlus className="size-5" aria-hidden />
              <span className="text-xs leading-4">Click to upload photo</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="prd-price">
              Base Price <span className="text-destructive">*</span>
            </Label>
            <Input
              id="prd-price"
              type="number"
              min="0"
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs leading-4 text-muted">
              Price per unit at base MOQ
            </p>
          </div>
        </div>
      </Section>

      {/* Size options */}
      <Repeatable
        title="Size Options"
        addLabel="Add Size"
        onAdd={() => setSizes((p) => [...p, emptySize()])}
      >
        {sizes.map((s, i) => (
          <OptionRow
            key={s.id}
            title={`Size ${i + 1}`}
            onRemove={
              sizes.length > 1
                ? () => setSizes((p) => p.filter((x) => x.id !== s.id))
                : undefined
            }
          >
            <TwoUp>
              <MiniField label="Label">
                <Input
                  value={s.label}
                  placeholder="e.g., Small"
                  onChange={(e) =>
                    setSizes((p) =>
                      p.map((x) =>
                        x.id === s.id ? { ...x, label: e.target.value } : x,
                      ),
                    )
                  }
                />
              </MiniField>
              <MiniField label="Price Multiplier">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={s.priceMultiplier}
                  onChange={(e) =>
                    setSizes((p) =>
                      p.map((x) =>
                        x.id === s.id
                          ? { ...x, priceMultiplier: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
              </MiniField>
            </TwoUp>
            <div className="grid grid-cols-4 gap-2">
              {(["length", "width", "height"] as const).map((dim) => (
                <MiniField
                  key={dim}
                  label={dim[0].toUpperCase() + dim.slice(1)}
                >
                  <Input
                    type="number"
                    min="0"
                    value={s[dim]}
                    onChange={(e) =>
                      setSizes((p) =>
                        p.map((x) =>
                          x.id === s.id
                            ? { ...x, [dim]: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                </MiniField>
              ))}
              <MiniField label="Unit">
                <Select
                  value={s.unit}
                  onChange={(e) =>
                    setSizes((p) =>
                      p.map((x) =>
                        x.id === s.id
                          ? { ...x, unit: e.target.value as SizeOption["unit"] }
                          : x,
                      ),
                    )
                  }
                >
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                  <option value="m">m</option>
                </Select>
              </MiniField>
            </div>
          </OptionRow>
        ))}
      </Repeatable>

      {/* Material options */}
      <Repeatable
        title="Material Options"
        addLabel="Add Material"
        onAdd={() => setMaterials((p) => [...p, emptyMaterial()])}
      >
        {materials.map((m, i) => (
          <OptionRow
            key={m.id}
            title={`Material ${i + 1}`}
            onRemove={
              materials.length > 1
                ? () => setMaterials((p) => p.filter((x) => x.id !== m.id))
                : undefined
            }
          >
            <TwoUp>
              <MiniField label="Label">
                <Input
                  value={m.label}
                  placeholder="e.g., Single Wall Corrugated"
                  onChange={(e) =>
                    setMaterials((p) =>
                      p.map((x) =>
                        x.id === m.id ? { ...x, label: e.target.value } : x,
                      ),
                    )
                  }
                />
              </MiniField>
              <MiniField label="Price Multiplier">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={m.priceMultiplier}
                  onChange={(e) =>
                    setMaterials((p) =>
                      p.map((x) =>
                        x.id === m.id
                          ? { ...x, priceMultiplier: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
              </MiniField>
            </TwoUp>
            <MiniField label="Description">
              <Input
                value={m.description}
                placeholder="Brief description"
                onChange={(e) =>
                  setMaterials((p) =>
                    p.map((x) =>
                      x.id === m.id
                        ? { ...x, description: e.target.value }
                        : x,
                    ),
                  )
                }
              />
            </MiniField>
          </OptionRow>
        ))}
      </Repeatable>

      {/* Print options */}
      <Repeatable
        title="Print Options"
        addLabel="Add Print Option"
        onAdd={() => setPrints((p) => [...p, emptyPrint()])}
      >
        {prints.map((pr, i) => (
          <OptionRow
            key={pr.id}
            title={`Print Option ${i + 1}`}
            onRemove={
              prints.length > 1
                ? () => setPrints((p) => p.filter((x) => x.id !== pr.id))
                : undefined
            }
          >
            <MiniField label="Label">
              <Input
                value={pr.label}
                placeholder="e.g., No Printing"
                onChange={(e) =>
                  setPrints((p) =>
                    p.map((x) =>
                      x.id === pr.id ? { ...x, label: e.target.value } : x,
                    ),
                  )
                }
              />
            </MiniField>
            <TwoUp>
              <MiniField label="Setup Fee">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pr.setupFee}
                  onChange={(e) =>
                    setPrints((p) =>
                      p.map((x) =>
                        x.id === pr.id
                          ? { ...x, setupFee: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
              </MiniField>
              <MiniField label="Price Per Unit">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pr.pricePerUnit}
                  onChange={(e) =>
                    setPrints((p) =>
                      p.map((x) =>
                        x.id === pr.id
                          ? { ...x, pricePerUnit: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
              </MiniField>
            </TwoUp>
            <MiniField label="Description">
              <Input
                value={pr.description}
                placeholder="Brief description"
                onChange={(e) =>
                  setPrints((p) =>
                    p.map((x) =>
                      x.id === pr.id
                        ? { ...x, description: e.target.value }
                        : x,
                    ),
                  )
                }
              />
            </MiniField>
          </OptionRow>
        ))}
      </Repeatable>

      {/* MOQ tiers */}
      <Repeatable
        title="MOQ Tiers"
        addLabel="Add Tier"
        onAdd={() => setTiers((p) => [...p, emptyTier()])}
      >
        {tiers.map((t, i) => (
          <OptionRow
            key={t.id}
            title={`Tier ${i + 1}`}
            onRemove={
              tiers.length > 1
                ? () => setTiers((p) => p.filter((x) => x.id !== t.id))
                : undefined
            }
          >
            <TwoUp>
              <MiniField label="Min Quantity">
                <Input
                  type="number"
                  min="1"
                  value={t.minQuantity}
                  onChange={(e) =>
                    setTiers((p) =>
                      p.map((x) =>
                        x.id === t.id
                          ? { ...x, minQuantity: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
              </MiniField>
              <MiniField label="Max Quantity" hint="(Optional)">
                <Input
                  type="number"
                  min="1"
                  value={t.maxQuantity ?? ""}
                  placeholder="No maximum"
                  onChange={(e) =>
                    setTiers((p) =>
                      p.map((x) =>
                        x.id === t.id
                          ? {
                              ...x,
                              maxQuantity: e.target.value
                                ? Number(e.target.value)
                                : null,
                            }
                          : x,
                      ),
                    )
                  }
                />
              </MiniField>
            </TwoUp>
            <MiniField label="Price Multiplier">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={t.priceMultiplier}
                onChange={(e) =>
                  setTiers((p) =>
                    p.map((x) =>
                      x.id === t.id
                        ? { ...x, priceMultiplier: Number(e.target.value) }
                        : x,
                    ),
                  )
                }
              />
            </MiniField>
            <p className="text-xs leading-4 text-muted">
              1.0 = base price · 0.85 = 15% off
            </p>
            <MiniField label="Label">
              <Input
                value={t.label}
                placeholder="e.g., Base Tier"
                onChange={(e) =>
                  setTiers((p) =>
                    p.map((x) =>
                      x.id === t.id ? { ...x, label: e.target.value } : x,
                    ),
                  )
                }
              />
            </MiniField>
          </OptionRow>
        ))}
      </Repeatable>
    </Dialog>
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
      <h3 className="pb-3 text-sm font-semibold leading-5 text-brand">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Repeatable({
  title,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 border-t border-line pt-4">
      <div className="flex items-center justify-between gap-3 pb-3">
        <h3 className="text-sm font-semibold leading-5 text-brand">{title}</h3>
        <Button size="xs" variant="outline" onClick={onAdd}>
          <Plus className="size-3.5" aria-hidden />
          {addLabel}
        </Button>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function OptionRow({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-button border border-line bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold leading-4 text-muted">{title}</p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${title}`}
            className="inline-flex size-6 items-center justify-center rounded-button text-muted transition-colors hover:bg-line/40 hover:text-destructive"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
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
