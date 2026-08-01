"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { CampaignBudgetType, PromoCode } from "@/lib/data/types";
import { NOT_CONNECTED_MESSAGE } from "@/lib/not-connected";
import { cn } from "@/lib/utils";

/**
 * Edit / Create Promotion — Figma (Promotions frame 3814:7183 dialog).
 *
 * This is Medusa's **Campaign** form: name, campaign_identifier, description,
 * starts_at/ends_at, and a budget of type usage|spend with a limit. See the
 * mapping table on `PromoCode` in lib/data/types.ts.
 *
 * ⚠ There is no `onSave`. Real Medusa promotions are Spec 2, so the submit
 * control is genuinely `disabled` and labelled rather than writing to
 * session-only state that vanishes on reload — same treatment as the
 * ProductCreator. Wire the real mutation here when the spec lands.
 */

export function PromotionDialog({
  promo,
  open,
  onClose,
}: {
  promo: PromoCode | null;
  open: boolean;
  onClose: () => void;
}) {
  const editing = Boolean(promo);

  const [name, setName] = React.useState(promo?.name ?? "");
  const [code, setCode] = React.useState(promo?.code ?? "");
  const [description, setDescription] = React.useState(
    promo?.description ?? "",
  );
  const [start, setStart] = React.useState(promo?.addedAt ?? "");
  const [end, setEnd] = React.useState(promo?.expiresAt ?? "");
  const [limitType, setLimitType] = React.useState<CampaignBudgetType>(
    promo?.budgetType ?? "usage",
  );
  const [limit, setLimit] = React.useState(String(promo?.limit ?? ""));
  const [perCustomer, setPerCustomer] = React.useState(
    promo?.limitPerCustomer === null ? "0" : String(promo?.limitPerCustomer ?? 1),
  );
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit Promotion" : "Create Promotion"}
      description={
        editing ? "Update campaign details." : "Set up a new promotional code."
      }
      width={520}
      footer={
        <div className="flex flex-col gap-2">
          <p className="text-xs leading-4 text-destructive">
            {NOT_CONNECTED_MESSAGE} Real promotions are not built yet.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled title={NOT_CONNECTED_MESSAGE}>
              {editing ? "Save changes" : "Create code"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name" htmlFor="promo-name">
          <Input
            id="promo-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Launch Special"
          />
        </Field>

        <Field label="Identifier (Promotional Code)" htmlFor="promo-code">
          <Input
            id="promo-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. LAUNCH20"
            className="uppercase"
          />
        </Field>

        <Field label="Description" htmlFor="promo-desc" optional>
          <Textarea
            id="promo-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this promotion…"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Start date" htmlFor="promo-start" optional>
            <Input
              id="promo-start"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>
          <Field label="End date" htmlFor="promo-end" optional>
            <Input
              id="promo-end"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <section className="mt-5 border-t border-line pt-4">
        <h3 className="text-sm font-medium leading-5 text-brand">
          Budget/Usage
        </h3>
        <p className="pb-3 text-xs leading-4 text-muted">
          Set usage/spend limits for your customers.
        </p>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium leading-[14px] text-brand">Type</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <TypeOption
              selected={limitType === "usage"}
              onSelect={() => setLimitType("usage")}
              title="Usage"
              hint="Set a limit on how many times the promotion can be used."
            />
            <TypeOption
              selected={limitType === "spend"}
              onSelect={() => setLimitType("spend")}
              title="Spend"
              hint="Set a limit on the total discounted amount of all orders."
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={limitType === "spend" ? "Limit (GH₵)" : "Limit"}
            htmlFor="promo-limit"
          >
            <Input
              id="promo-limit"
              type="number"
              min="1"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder={limitType === "spend" ? "50000" : "200"}
            />
          </Field>
          {/* Medusa only supports per-customer caps on USAGE budgets. */}
          <Field label="Limit usage per" htmlFor="promo-per">
            <Select
              id="promo-per"
              value={limitType === "spend" ? "0" : perCustomer}
              disabled={limitType === "spend"}
              onChange={(e) => setPerCustomer(e.target.value)}
            >
              <option value="1">1 per customer</option>
              <option value="2">2 per customer</option>
              <option value="0">Unlimited per customer</option>
            </Select>
            {limitType === "spend" && (
              <p className="text-xs leading-4 text-muted">
                Not available for spend budgets.
              </p>
            )}
          </Field>
        </div>

      </section>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        {optional && (
          <span className="ml-1 font-normal text-muted">(Optional)</span>
        )}
      </Label>
      {children}
    </div>
  );
}

function TypeOption({
  selected,
  onSelect,
  title,
  hint,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-1 rounded-button border p-3 text-left transition-colors",
        selected
          ? "border-brand bg-[rgba(61,52,40,0.05)]"
          : "border-line hover:bg-line/30",
      )}
    >
      <span className="text-sm font-medium leading-5 text-brand">{title}</span>
      <span className="text-xs leading-4 text-muted">{hint}</span>
    </button>
  );
}
