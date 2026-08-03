"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { LengthUnit } from "@/lib/data/product-form";

/**
 * Medusa-style dynamic product options: repeatable blocks where the operator
 * types the TITLE customers will see ("Colour", "Capacity", "Finish") and then
 * its values.
 *
 * ⚠ WHY EACH BLOCK ALSO PICKS A SECTION, instead of the title being free-form
 * all the way down to Medusa.
 *
 * `storefront/src/lib/products.ts` does not iterate a product's options. It
 * reads three LITERAL keys off every variant — `opts.Size`, `opts.Material`,
 * `opts.Printing` (products.ts:432) — and builds its customizer sections from
 * them. A product whose Medusa option is titled "Color" yields `""` for all
 * three, so every variant collapses into a single combo, no sections render,
 * and the page silently sells an arbitrary variant. There is no error.
 *
 * So the Medusa option TITLE stays one of those three, and the operator's own
 * title is written to `metadata.option_labels` — which is exactly what the
 * live catalog already does (Pizza Box: `{ Size: "Size", Material: "Colour" }`)
 * and what the storefront renders as the section heading. The operator types
 * "Colour" and sees "Colour"; the plumbing underneath stays something the
 * storefront can read.
 *
 * Lifting this restriction means teaching the storefront customizer to render
 * N arbitrary axes — a change in `storefront/`, not here.
 */

export type OptionRole = "size" | "material" | "printing";

export type ValueRow = {
  key: string;
  value: string;
  description?: string;
  /** Printing only. */
  setupFee?: number;
  perUnit?: number;
  /** Size only, in `unit`. */
  length?: number | null;
  width?: number | null;
  height?: number | null;
  unit?: LengthUnit;
};

export type OptionBlock = {
  key: string;
  role: OptionRole;
  /** What customers see as the section heading. */
  title: string;
  values: ValueRow[];
};

export const ROLE_ORDER: OptionRole[] = ["size", "material", "printing"];

export const ROLE_HELP: Record<OptionRole, string> = {
  size: "Sizes and dimensions. Drives the storefront's size picker.",
  material: "Board, colour or finish choices.",
  printing: "Print treatments, with their setup and per-unit charges.",
};

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export const newValue = (): ValueRow => ({
  key: uid("val"),
  value: "",
  description: "",
  setupFee: 0,
  perUnit: 0,
  length: null,
  width: null,
  height: null,
  unit: "mm",
});

export const newBlock = (role: OptionRole, title: string): OptionBlock => ({
  key: uid("opt"),
  role,
  title,
  values: [newValue()],
});

export function OptionsEditor({
  blocks,
  onChange,
  /** Editing an existing product: values are fixed (removing one destroys
   *  variants, stock and open carts), titles and descriptors are not. */
  locked,
}: {
  blocks: OptionBlock[];
  onChange: (next: OptionBlock[]) => void;
  locked: boolean;
}) {
  const usedRoles = new Set(blocks.map((b) => b.role));
  const freeRoles = ROLE_ORDER.filter((r) => !usedRoles.has(r));

  const update = (key: string, patch: Partial<OptionBlock>) =>
    onChange(blocks.map((b) => (b.key === key ? { ...b, ...patch } : b)));

  const updateValue = (blockKey: string, valueKey: string, patch: Partial<ValueRow>) =>
    onChange(
      blocks.map((b) =>
        b.key === blockKey
          ? {
              ...b,
              values: b.values.map((v) =>
                v.key === valueKey ? { ...v, ...patch } : v,
              ),
            }
          : b,
      ),
    );

  return (
    <section className="mt-6 border-t border-line pt-4">
      <div className="flex items-center justify-between gap-3 pb-1">
        <h3 className="text-sm font-semibold leading-5 text-brand">
          Product Options
        </h3>
        {!locked && freeRoles.length > 0 && (
          <Button
            size="xs"
            variant="outline"
            onClick={() =>
              onChange([
                ...blocks,
                newBlock(freeRoles[0], defaultTitle(freeRoles[0])),
              ])
            }
          >
            <Plus className="size-3.5" aria-hidden />
            Add Option
          </Button>
        )}
      </div>
      <p className="pb-3 text-xs leading-4 text-muted">
        Name each option the way customers should see it — &ldquo;Colour&rdquo;,
        &ldquo;Capacity&rdquo;, &ldquo;Finish&rdquo;. Every combination of
        values becomes a variant below.
      </p>

      <div className="flex flex-col gap-3">
        {blocks.length === 0 && (
          <p className="text-xs leading-4 text-muted">
            No options yet — add one to start building variants.
          </p>
        )}

        {blocks.map((block) => (
          <div
            key={block.key}
            className="flex flex-col gap-3 rounded-button border border-line bg-background p-3"
          >
            <div className="flex items-start gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Label
                  htmlFor={`opt-title-${block.key}`}
                  className="text-xs font-medium text-muted"
                >
                  Option title
                </Label>
                <Input
                  id={`opt-title-${block.key}`}
                  className="h-8 text-xs"
                  value={block.title}
                  placeholder="e.g., Colour"
                  onChange={(e) => update(block.key, { title: e.target.value })}
                />
              </div>
              <div className="flex w-[132px] shrink-0 flex-col gap-1">
                <Label
                  htmlFor={`opt-role-${block.key}`}
                  className="text-xs font-medium text-muted"
                >
                  Storefront section
                </Label>
                <Select
                  id={`opt-role-${block.key}`}
                  className="h-8 text-xs"
                  value={block.role}
                  disabled={locked}
                  onChange={(e) =>
                    update(block.key, { role: e.target.value as OptionRole })
                  }
                >
                  {ROLE_ORDER.filter(
                    (r) => r === block.role || !usedRoles.has(r),
                  ).map((r) => (
                    <option key={r} value={r}>
                      {defaultTitle(r)}
                    </option>
                  ))}
                </Select>
              </div>
              {!locked && (
                <button
                  type="button"
                  onClick={() =>
                    onChange(blocks.filter((b) => b.key !== block.key))
                  }
                  aria-label={`Remove option ${block.title || block.role}`}
                  className="mt-5 inline-flex size-6 shrink-0 items-center justify-center rounded-button text-muted transition-colors hover:bg-line/40 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              )}
            </div>
            <p className="-mt-1 text-xs leading-4 text-muted">
              {ROLE_HELP[block.role]}
            </p>

            <div className="flex flex-col gap-2">
              {block.values.map((v, i) => (
                <div
                  key={v.key}
                  className="flex flex-col gap-2 rounded-button border border-line bg-surface p-2"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      // readOnly, NOT disabled: a locked value must stay
                      // legible. `disabled` dims to 50% opacity, which made
                      // real values ("10\"", "Brown Kraft") read as empty
                      // placeholder text.
                      className="h-8 flex-1 text-xs read-only:text-muted"
                      value={v.value}
                      placeholder={`${block.title || "Value"} ${i + 1}`}
                      readOnly={locked}
                      aria-readonly={locked || undefined}
                      title={
                        locked
                          ? "Option values can't be changed here — see the note above."
                          : undefined
                      }
                      onChange={(e) =>
                        updateValue(block.key, v.key, { value: e.target.value })
                      }
                    />
                    {!locked && block.values.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          update(block.key, {
                            values: block.values.filter((x) => x.key !== v.key),
                          })
                        }
                        aria-label={`Remove value ${v.value || i + 1}`}
                        className="inline-flex size-6 shrink-0 items-center justify-center rounded-button text-muted transition-colors hover:bg-line/40 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    )}
                  </div>

                  {block.role === "size" && (
                    <div className="grid grid-cols-4 gap-2">
                      {(["length", "width", "height"] as const).map((dim) => (
                        <LabelledInput
                          key={dim}
                          label={dim[0].toUpperCase() + dim.slice(1)}
                          type="number"
                          min="0"
                          value={v[dim] ?? ""}
                          onChange={(raw) =>
                            updateValue(block.key, v.key, {
                              [dim]: raw ? Number(raw) : null,
                            })
                          }
                        />
                      ))}
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium leading-4 text-muted">
                          Unit
                        </span>
                        <Select
                          className="h-8 text-xs"
                          value={v.unit ?? "mm"}
                          onChange={(e) =>
                            updateValue(block.key, v.key, {
                              unit: e.target.value as LengthUnit,
                            })
                          }
                        >
                          <option value="mm">mm</option>
                          <option value="cm">cm</option>
                          <option value="m">m</option>
                        </Select>
                      </div>
                    </div>
                  )}

                  {block.role === "material" && (
                    <LabelledInput
                      label="Description"
                      value={v.description ?? ""}
                      placeholder="Brief description"
                      onChange={(raw) =>
                        updateValue(block.key, v.key, { description: raw })
                      }
                    />
                  )}

                  {block.role === "printing" && (
                    <div className="grid grid-cols-2 gap-2">
                      <LabelledInput
                        label="Setup fee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.setupFee ?? 0}
                        onChange={(raw) =>
                          updateValue(block.key, v.key, {
                            setupFee: Number(raw) || 0,
                          })
                        }
                      />
                      <LabelledInput
                        label="Price per unit"
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.perUnit ?? 0}
                        onChange={(raw) =>
                          updateValue(block.key, v.key, {
                            perUnit: Number(raw) || 0,
                          })
                        }
                      />
                      <div className="col-span-2">
                        <LabelledInput
                          label="Description"
                          value={v.description ?? ""}
                          placeholder="Brief description"
                          onChange={(raw) =>
                            updateValue(block.key, v.key, { description: raw })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {!locked && (
                <Button
                  size="xs"
                  variant="ghost"
                  className="self-start"
                  onClick={() =>
                    update(block.key, { values: [...block.values, newValue()] })
                  }
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add value
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function defaultTitle(role: OptionRole): string {
  return role === "size" ? "Size" : role === "material" ? "Material" : "Printing";
}

function LabelledInput({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium leading-4 text-muted">{label}</span>
      <Input
        className="h-8 text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </div>
  );
}
