"use client";

import * as React from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { Order, RefundMode } from "@/lib/data/types";
import { cn, formatCedis } from "@/lib/utils";

/**
 * Cancel Order dialog — Figma (Orders frame 3835:19533).
 * Three refund choices, plus a REQUIRED note that is written to the order's
 * activity history.
 */
const OPTIONS: { key: RefundMode; label: string; hint: (o: Order) => string }[] =
  [
    {
      key: "full",
      label: "Full refund",
      hint: (o) => `Refund the full ${formatCedis(o.total)}`,
    },
    {
      key: "partial",
      label: "Partial refund",
      hint: () => "Specify the amount to refund",
    },
    {
      key: "none",
      label: "No refund",
      hint: () => "Cancel without issuing any refund",
    },
  ];

export function CancelOrderDialog({
  order,
  open,
  onClose,
  onConfirm,
}: {
  order: Order;
  open: boolean;
  onClose: () => void;
  onConfirm: (opts: {
    refund: RefundMode;
    amount?: number;
    note: string;
  }) => void;
}) {
  const [refund, setRefund] = React.useState<RefundMode>("full");
  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  const noteMissing = note.trim().length === 0;
  const amountInvalid =
    refund === "partial" &&
    (!amount || Number(amount) <= 0 || Number(amount) > order.total);

  const submit = () => {
    setTouched(true);
    if (noteMissing || amountInvalid) return;
    onConfirm({
      refund,
      amount: refund === "partial" ? Number(amount) : undefined,
      note: note.trim(),
    });
    setRefund("full");
    setAmount("");
    setNote("");
    setTouched(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cancel Order"
      description={`Cancelling ${order.number} · Total: ${formatCedis(order.total)}`}
      width={462}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Keep Order
          </Button>
          {/* Figma: bg #9b6b8f, white label + white XCircle glyph. */}
          <Button variant="plum" onClick={submit}>
            <XCircle className="size-4" aria-hidden />
            Confirm Cancellation
          </Button>
        </div>
      }
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 text-sm font-medium leading-[14px] text-brand">
          Refund
        </legend>
        {OPTIONS.map((opt) => (
          <label
            key={opt.key}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-button border p-3 transition-colors",
              refund === opt.key
                ? "border-brand bg-[rgba(61,52,40,0.05)]"
                : "border-line hover:bg-line/30",
            )}
          >
            <input
              type="radio"
              name="refund-mode"
              value={opt.key}
              checked={refund === opt.key}
              onChange={() => setRefund(opt.key)}
              className="mt-0.5 size-4 accent-[#3d3428]"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-5 text-brand">
                {opt.label}
              </span>
              <span className="text-xs leading-4 text-muted">
                {opt.hint(order)}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {refund === "partial" && (
        <div className="mt-4 flex flex-col gap-2">
          <Label htmlFor="refund-amount">Refund amount (GH₵)</Label>
          <Input
            id="refund-amount"
            type="number"
            min="0"
            max={order.total}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            aria-invalid={touched && amountInvalid}
          />
          {touched && amountInvalid && (
            <p className="text-xs text-destructive">
              Enter an amount between 0 and {formatCedis(order.total)}.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <Label htmlFor="cancel-note">
          Note <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="cancel-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for cancellation, customer communication, etc."
          aria-invalid={touched && noteMissing}
        />
        <p
          className={cn(
            "text-xs leading-4",
            touched && noteMissing ? "text-destructive" : "text-muted",
          )}
        >
          Required — this will be recorded in the order activity history.
        </p>
      </div>
    </Dialog>
  );
}
