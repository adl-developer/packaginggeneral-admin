"use client";

import * as React from "react";
import { FormAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

/**
 * Confirmation step for the Users screen's irreversible actions — removing a
 * user, revoking an invite, and resending an invite (which invalidates the
 * link already sitting in someone's inbox).
 *
 * The confirm button is plum, not red: destructive actions in these designs
 * are plum throughout (see `ui/button.tsx`) — there is no red button anywhere
 * in the admin.
 *
 * A backend refusal is shown IN HERE rather than closing the dialog and
 * toasting. The operator is mid-decision, and the refusals these actions
 * produce ("this is the last super admin", "already accepted — remove the
 * user instead") are direct answers to the question they just asked. `busy`
 * disables both buttons while the call is in flight, so a double-click can't
 * fire a delete twice, and blocks the dismiss paths so the dialog can't
 * vanish mid-request leaving the operator unsure whether it landed.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  body,
  confirmLabel,
  onConfirm,
  onClose,
  busy = false,
  error,
}: {
  open: boolean;
  title: string;
  description?: string;
  body: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
  error?: string | null;
}) {
  const guardedClose = React.useCallback(() => {
    if (busy) return;
    onClose();
  }, [busy, onClose]);

  return (
    <Dialog
      open={open}
      onClose={guardedClose}
      title={title}
      description={description}
      width={462}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={guardedClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="plum" onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 text-sm leading-5 text-brand">
        {body}
        {error && <FormAlert>{error}</FormAlert>}
      </div>
    </Dialog>
  );
}
