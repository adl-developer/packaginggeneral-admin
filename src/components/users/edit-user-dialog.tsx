"use client";

import * as React from "react";
import { FormAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { updateUser } from "@/lib/actions/users";
import type { UserRow } from "@/lib/data/users";

/**
 * Rename a team member.
 *
 * ⚠ NAME ONLY, and the email is shown as read-only text rather than a
 * disabled input — a greyed-out field reads as "editable later", which this
 * one never will be from here. A Medusa user's `email` is not their sign-in
 * credential (that lives on the auth identity's emailpass record), so writing
 * one without the other would leave the portal displaying an address the
 * person cannot log in with. The backend 400s if `email` is sent at all. See
 * `backend/src/api/admin/pg/users/[id]/route.ts`.
 *
 * Role isn't here either: it has its own always-visible select in the row,
 * and its own endpoint with its own guards (last-super-admin, self-demotion).
 */
export function EditUserDialog({
  user,
  open,
  onClose,
  onSaved,
}: {
  user: UserRow;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = React.useState(user.first_name ?? "");
  const [lastName, setLastName] = React.useState(user.last_name ?? "");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  // ⚠ There is no "re-seed on a different user" effect here, deliberately.
  // The caller mounts this with `key={user.id}`, so pointing the dialog at a
  // different person REMOUNTS it and the useState initialisers above run
  // again with that person's name. An effect calling setState would do the
  // same job by cascading an extra render, which is what
  // `react-hooks/set-state-in-effect` (correctly) rejects.

  // Both blank would leave the row rendering the email (or "Unnamed user") as
  // its name — allowed by the backend, but almost never what was meant, so
  // it's stopped at the keyboard.
  const empty = !firstName.trim() && !lastName.trim();
  const unchanged =
    firstName.trim() === (user.first_name ?? "").trim() &&
    lastName.trim() === (user.last_name ?? "").trim();

  function close() {
    if (pending) return;
    setError(null);
    onClose();
  }

  function submit() {
    if (empty || unchanged) return;
    setError(null);
    startTransition(async () => {
      const result = await updateUser(user.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      if (!result.ok) {
        // Keep the dialog open on a refusal (403 for a non-super-admin, 404
        // for an account removed in another tab) — closing it would read as
        // a save.
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Edit User"
      description="Update this team member's name."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || empty || unchanged}>
            {pending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-first-name">First name</Label>
          <Input
            id="edit-first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={pending}
            maxLength={100}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-last-name">Last name</Label>
          <Input
            id="edit-last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={pending}
            maxLength={100}
          />
        </div>

        {empty && (
          <p className="text-xs leading-4 text-destructive">
            Enter at least one name.
          </p>
        )}

        {/* Read-only text, not a disabled input — see the file header. */}
        <div className="flex flex-col gap-1 border-t border-line pt-4">
          <p className="text-xs font-medium leading-4 text-muted">Email</p>
          <p className="text-sm leading-5 text-brand">{user.email ?? "—"}</p>
          <p className="text-xs leading-4 text-muted">
            A user&rsquo;s email is their sign-in identity and can&rsquo;t be
            changed here. To move someone to a new address, remove the account
            and invite the new one.
          </p>
        </div>

        {error && <FormAlert>{error}</FormAlert>}
      </div>
    </Dialog>
  );
}
