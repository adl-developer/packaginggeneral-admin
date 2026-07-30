"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  addStock,
  releaseReservation,
  reserveStock,
  setProductThreshold,
  setVariantThreshold,
} from "@/lib/actions/inventory";
import type { StaffReservation } from "@/lib/data/inventory";

export type DialogRequest =
  | { kind: "add-stock"; id: string; label: string; current: number }
  | {
      kind: "reserve";
      id: string;
      label: string;
      available: number;
      reservations: StaffReservation[];
    }
  | {
      kind: "threshold";
      scope: "variant" | "product";
      id: string;
      label: string;
      current: number | null;
    };

const nf = new Intl.NumberFormat("en-GH");

/**
 * Thin wrapper that only decides WHETHER a dialog is open. The actual dialog
 * is keyed by request identity so React remounts (and re-initialises all
 * local field state) whenever a different variant/product/action is picked —
 * that replaces a reset-on-change `useEffect`, which the react-hooks lint
 * rule flags as a cascading-render risk.
 */
export function StockDialogs({
  request,
  onClose,
}: {
  request: DialogRequest | null;
  onClose: () => void;
}) {
  if (!request) return null;
  return (
    <StockDialog
      key={`${request.kind}-${request.id}`}
      request={request}
      onClose={onClose}
    />
  );
}

function StockDialog({
  request,
  onClose,
}: {
  request: DialogRequest;
  onClose: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Field state — initialised once per mount, i.e. once per opened dialog
  // (see the `key` on the wrapper above).
  const [amount, setAmount] = React.useState(() =>
    request.kind === "threshold" && request.current !== null
      ? String(request.current)
      : "",
  );
  const [reason, setReason] = React.useState("");

  const finish = (result: { ok: true } | { ok: false; error: string }) => {
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // The action revalidates /inventory; refresh so the server component
    // re-renders with the new figures.
    router.refresh();
    onClose();
  };

  // ── Add Stock ────────────────────────────────────────────────────────────
  if (request.kind === "add-stock") {
    const delta = Number(amount);
    const valid = Number.isInteger(delta) && delta !== 0;
    const resulting = valid ? Math.max(0, request.current + delta) : request.current;

    return (
      <Dialog
        open
        onClose={onClose}
        title="Add stock"
        description={request.label}
        footer={
          <>
            <Button variant="outline" size="md" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!valid || busy}
              onClick={() => {
                setBusy(true);
                setError(null);
                addStock(request.id, delta).then(finish);
              }}
            >
              {busy ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-delta">Adjustment</Label>
            <Input
              id="stock-delta"
              type="number"
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500, or -50 to correct a mistake"
            />
          </div>
          <p className="text-xs text-muted">
            Current stock {nf.format(request.current)} →{" "}
            <span className="font-medium text-brand">{nf.format(resulting)}</span>
            . Negative adjustments are allowed so a mistyped figure can be
            corrected; stock never goes below zero.
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </Dialog>
    );
  }

  // ── Reserve ──────────────────────────────────────────────────────────────
  if (request.kind === "reserve") {
    const qty = Number(amount);
    const valid = Number.isInteger(qty) && qty > 0 && reason.trim().length > 0;
    const overCommits = valid && qty > request.available;

    return (
      <Dialog
        open
        onClose={onClose}
        title="Reserve stock"
        description={request.label}
        footer={
          <>
            <Button variant="outline" size="md" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!valid || busy}
              onClick={() => {
                setBusy(true);
                setError(null);
                reserveStock(request.id, qty, reason.trim()).then(finish);
              }}
            >
              {busy ? "Reserving..." : "Reserve"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reserve-qty">Quantity *</Label>
            <Input
              id="reserve-qty"
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reserve-reason">Reason *</Label>
            <Textarea
              id="reserve-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Who or what is this held for?"
            />
          </div>
          <p className="text-xs text-muted">
            {nf.format(request.available)} available.
          </p>
          {overCommits && (
            <p className="text-xs text-[#964022]">
              This is more than is available. Allowed — stock figures here are
              advisory and never block a sale — but the shortfall is real.
            </p>
          )}

          {request.reservations.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-line pt-3">
              <p className="text-xs font-semibold text-brand">Existing holds</p>
              {request.reservations.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-3">
                  <span className="text-xs text-muted">
                    <span className="font-medium text-brand">
                      {nf.format(r.quantity)}
                    </span>{" "}
                    — {r.reason ?? "no reason given"}
                  </span>
                  {/* Releasing frees stock: plum, per the destructive
                      convention. Never red. */}
                  <Button
                    variant="plumOutline"
                    size="xs"
                    disabled={busy}
                    onClick={() => {
                      setBusy(true);
                      setError(null);
                      releaseReservation(r.id).then(finish);
                    }}
                  >
                    Release
                  </Button>
                </div>
              ))}
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </Dialog>
    );
  }

  // ── Threshold ────────────────────────────────────────────────────────────
  const trimmed = amount.trim();
  const clearing = trimmed === "";
  const threshold = Number(trimmed);
  const valid = clearing || (Number.isInteger(threshold) && threshold >= 0);

  return (
    <Dialog
      open
      onClose={onClose}
      title="Stock alert level"
      description={request.label}
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!valid || busy}
            onClick={() => {
              setBusy(true);
              setError(null);
              const value = clearing ? null : threshold;
              const call =
                request.scope === "product"
                  ? setProductThreshold(request.id, value)
                  : setVariantThreshold(request.id, value);
              call.then(finish);
            }}
          >
            {busy ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="threshold">Alert when available falls to</Label>
          <Input
            id="threshold"
            type="number"
            min={0}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Leave empty for no alert"
          />
        </div>
        <p className="text-xs text-muted">
          {request.scope === "product"
            ? "Applies to every variant of this product, replacing any individual levels."
            : "Applies to this variant only."}{" "}
          Clearing the field turns alerting off.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </Dialog>
  );
}
