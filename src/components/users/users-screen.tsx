"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Pencil,
  Send,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  XCircle,
} from "lucide-react";
import { ConfirmDialog } from "@/components/users/confirm-dialog";
import { EditUserDialog } from "@/components/users/edit-user-dialog";
import { RolePill } from "@/components/users/role-pill";
import { ErrorToastStack, FormAlert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import {
  deleteUser,
  inviteUser,
  resendInvite,
  revokeInvite,
  setUserRole,
} from "@/lib/actions/users";
import type { InviteRow, UserRow, UsersPayload } from "@/lib/data/users";
import { ROLE_DESCRIPTION, ROLE_LABEL, type TeamRole } from "@/lib/data/types";
import { useSession } from "@/lib/session-context";
import { formatDate } from "@/lib/utils";

const ROLES: TeamRole[] = ["super-admin", "admin", "order-manager"];

/**
 * A confirmation the operator has been asked to approve, plus the call it
 * makes. Holding the action as a thunk keeps the dialog generic — the copy
 * and the effect are declared together at the call site, so a dialog can
 * never end up describing one action and performing another.
 */
type PendingAction = {
  title: string;
  description?: string;
  body: React.ReactNode;
  confirmLabel: string;
  run: () => Promise<{ ok: true } | { ok: false; error: string }>;
};

function removeUserAction(user: UserRow): PendingAction {
  const label = user.name || user.email || "this user";
  return {
    title: "Remove User",
    description: `${label}${user.email ? ` · ${user.email}` : ""}`,
    confirmLabel: "Remove User",
    body: (
      <>
        <p>
          This deletes <strong>{label}</strong>&rsquo;s account and unlinks
          their sign-in, so they immediately lose access to the admin portal
          and the Medusa admin.
        </p>
        <p className="text-muted">
          It can&rsquo;t be undone from here — restoring access means inviting
          them again as a new account. Their past activity on orders (claims,
          notes, stage changes) stays recorded against their name.
        </p>
      </>
    ),
    run: () => deleteUser(user.id),
  };
}

function revokeInviteAction(invite: InviteRow): PendingAction {
  return {
    title: "Revoke Invite",
    description: invite.email,
    confirmLabel: "Revoke Invite",
    body: (
      <>
        <p>
          The invitation link sent to <strong>{invite.email}</strong> stops
          working immediately.
        </p>
        <p className="text-muted">
          Worth doing rather than waiting for it to lapse: until it expires,
          anyone holding that link can create an admin account with the{" "}
          {ROLE_LABEL[invite.role]} role.
        </p>
      </>
    ),
    run: () => revokeInvite(invite.id),
  };
}

function resendInviteAction(invite: InviteRow): PendingAction {
  return {
    title: "Resend Invite",
    description: invite.email,
    confirmLabel: "Resend Invite",
    body: (
      <>
        <p>
          Sends a fresh invitation email to <strong>{invite.email}</strong>{" "}
          with a new link and a new expiry date.
        </p>
        <p className="text-muted">
          The previous link stops working — if they already have the first
          email open, tell them to use the new one.
        </p>
      </>
    ),
    run: () => resendInvite(invite.id),
  };
}

/** True when a pending invite's link has already lapsed. Null expiry reads as
 *  NOT expired: an unknown date must not be presented as a known deadline. */
function isExpired(invite: InviteRow): boolean {
  if (!invite.expires_at) return false;
  const at = new Date(invite.expires_at).getTime();
  return Number.isFinite(at) && at < Date.now();
}

/** Legend glyphs mirror the role-pill icons, but muted (Figma: all #7a7575). */
const LEGEND_ICON: Record<TeamRole, typeof Shield> = {
  "super-admin": ShieldCheck,
  admin: Shield,
  "order-manager": ClipboardList,
};

/**
 * Team Members — Figma 3803:3429, wired to `GET /admin/pg/users`,
 * `PATCH /admin/pg/users/:id/role` and `POST /admin/pg/users/invites`.
 *
 * Users and pending invites are two separate arrays on the payload (the
 * backend keeps them independently truncatable — see
 * `lib/data/users.ts`) but render in ONE table here, distinguished by the
 * existing `status` badge (`active` vs `pending`) exactly as the Figma design
 * already shows both states. A pending invite's role was fixed at creation
 * time (there is no backend route to change an invite's role), so only user
 * rows get the editable role select.
 *
 * ⚠ Reaching this screen at all already means the signed-in user is a
 * super-admin (`portal-tabs.tsx` hides the tab otherwise) — but that is
 * navigation-hiding, not access control. If the backend ever refuses a
 * mutation here (403/400/409), the failure below surfaces the backend's own
 * message rather than pretending success, exactly as it would for anyone who
 * reached this screen by URL rather than the tab.
 *
 * ── Management actions (added 2026-08-02) ─────────────────────────────────
 * Users: Edit (name) · Remove. Invites: Resend · Revoke. Every one of them is
 * super-admin-gated ON THE BACKEND, and every destructive one goes through a
 * confirmation that states what actually happens.
 *
 * ⚠ Three things are deliberately ABSENT, and each absence is a decision:
 *   • Editing a user's EMAIL — `user.email` is not the sign-in credential
 *     (that's the auth identity's emailpass record), so changing one without
 *     the other silently breaks login. See `edit-user-dialog.tsx`.
 *   • SUSPEND / deactivate — Medusa users have no active flag, and a
 *     metadata one would be enforced by nothing: the "suspended" person would
 *     still authenticate against the Medusa admin API. That is security
 *     theatre, which this project's rules forbid. Removal is the only revoke
 *     that is real.
 *   • Setting another user's PASSWORD — an admin who can set a colleague's
 *     password can impersonate them. The correct flow is a user-initiated
 *     reset, and this backend's `password-reset-email` subscriber currently
 *     handles customers only (`actor_type !== "customer"` returns early), so
 *     a staff reset needs backend work before it can be offered.
 */
export function UsersScreen({ payload }: { payload: UsersPayload }) {
  const router = useRouter();
  const currentUser = useSession();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<UserRow | null>(null);
  // One pending confirmation at a time — the dialog is modal, so a second
  // can't be opened while one is up.
  const [confirming, setConfirming] = React.useState<PendingAction | null>(null);
  const [confirmBusy, setConfirmBusy] = React.useState(false);
  const [confirmError, setConfirmError] = React.useState<string | null>(null);
  // Lifted out of the row: a refusal is reported in the toast stack at the
  // bottom of the screen, not inside the 168px-wide Role cell that raised it.
  // Keyed by user id so a second row's failure replaces nothing — each row
  // that is currently refusing gets its own toast.
  const [roleErrors, setRoleErrors] = React.useState<Record<string, string>>({});

  const refresh = React.useCallback(() => router.refresh(), [router]);

  const setRoleError = React.useCallback((id: string, message: string | null) => {
    setRoleErrors((prev) => {
      if (message === null) {
        if (!(id in prev)) return prev;
        const rest = { ...prev };
        delete rest[id];
        return rest;
      }
      return { ...prev, [id]: message };
    });
  }, []);

  function closeConfirm() {
    setConfirming(null);
    setConfirmBusy(false);
    setConfirmError(null);
  }

  /**
   * Runs the confirmed action. On success the dialog closes and the Server
   * Component refetches; on refusal the dialog STAYS OPEN showing the
   * backend's own message — "this is the last super admin" is an answer to
   * the question the operator just asked, not a stray toast.
   */
  async function runConfirmed() {
    if (!confirming || confirmBusy) return;
    setConfirmBusy(true);
    setConfirmError(null);
    const result = await confirming.run();
    if (!result.ok) {
      setConfirmBusy(false);
      setConfirmError(result.error);
      return;
    }
    closeConfirm();
    refresh();
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold leading-7 text-brand">
                Team Members
              </h2>
              <p className="text-sm leading-5 text-muted">
                {payload.total_users} active ·{" "}
                {payload.total_invites} pending invite
                {payload.total_invites === 1 ? "" : "s"}
              </p>
            </div>
            <Button onClick={() => setOpen(true)}>
              <UserPlus className="size-4" aria-hidden />
              Add User
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/*
            Role legend — Figma renders this as a plain 8px-gap list on the card
            background with 14px muted icons and 12px/400 muted text. It is NOT
            a tinted panel.
          */}
          <ul className="flex flex-col gap-2 pb-4">
            {ROLES.map((role) => {
              const Icon = LEGEND_ICON[role];
              return (
                <li
                  key={role}
                  className="flex items-center gap-2 text-xs leading-4 text-muted"
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  {ROLE_DESCRIPTION[role]}
                </li>
              );
            })}
          </ul>

          {payload.users.length === 0 && payload.invites.length === 0 ? (
            <p className="border-t border-line py-12 text-center text-sm text-muted">
              No users found
            </p>
          ) : (
            <Table bleed>
              <THead tinted>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Status</TH>
                  <TH>Joined</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {payload.users.map((u) => (
                  <TR key={u.id}>
                    <TD>
                      <span className="flex items-center gap-3">
                        <Avatar name={u.name} />
                        <span className="font-medium">
                          {u.name}
                          {u.id === currentUser.id && (
                            <span className="ml-1 text-xs font-normal text-muted">
                              (you)
                            </span>
                          )}
                        </span>
                      </span>
                    </TD>
                    <TD className="text-muted">{u.email ?? "—"}</TD>
                    <TD>
                      <RoleCell
                        userId={u.id}
                        userLabel={u.name || u.email || "this user"}
                        role={u.role}
                        onChanged={refresh}
                        onError={setRoleError}
                      />
                    </TD>
                    <TD>
                      {/* Figma: solid brand fill for an active member. */}
                      <Badge tone="solid">Active</Badge>
                    </TD>
                    <TD className="text-xs whitespace-nowrap text-muted">
                      {formatDate(u.joined_at)}
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setEditing(u)}
                        >
                          <Pencil className="size-3.5" aria-hidden />
                          Edit
                        </Button>
                        {/* Removing yourself is refused by the backend
                            (you'd lose the role that lets you undo it), so
                            the control isn't offered on your own row either
                            — a button whose only outcome is a refusal is
                            worse than no button. The backend check remains
                            the real boundary. */}
                        {u.id !== currentUser.id && (
                          <Button
                            size="xs"
                            variant="plumOutline"
                            onClick={() => setConfirming(removeUserAction(u))}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            Remove
                          </Button>
                        )}
                      </div>
                    </TD>
                  </TR>
                ))}
                {payload.invites.map((i) => (
                  <TR key={i.id}>
                    <TD>
                      <span className="flex items-center gap-3">
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-line">
                          <UserPlus
                            className="size-3.5 text-muted"
                            aria-hidden
                          />
                        </span>
                        <span className="font-medium text-muted">
                          Invited
                        </span>
                      </span>
                    </TD>
                    <TD className="text-muted">{i.email}</TD>
                    <TD>
                      {/* Not editable — the backend has no route to change a
                          pending invite's role; it was fixed at creation. */}
                      <RolePill role={i.role} />
                    </TD>
                    <TD>
                      {/* Outline, not solid — distinguishes "pending" from
                          the filled "active" badge above. An expired invite
                          says so: otherwise it is indistinguishable from a
                          live one and staff wait on somebody whose link
                          stopped working. */}
                      <Badge tone="outline">
                        {isExpired(i) ? "Expired" : "Pending"}
                      </Badge>
                    </TD>
                    <TD className="text-xs whitespace-nowrap text-muted">
                      {formatDate(i.joined_at)}
                      {i.expires_at && (
                        <span className="block">
                          {isExpired(i) ? "Expired" : "Expires"}{" "}
                          {formatDate(i.expires_at)}
                        </span>
                      )}
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setConfirming(resendInviteAction(i))}
                        >
                          <Send className="size-3.5" aria-hidden />
                          Resend
                        </Button>
                        <Button
                          size="xs"
                          variant="plumOutline"
                          onClick={() => setConfirming(revokeInviteAction(i))}
                        >
                          <XCircle className="size-3.5" aria-hidden />
                          Revoke
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {(payload.users_truncated || payload.invites_truncated) && (
        <p className="mt-4 text-center text-xs text-muted">
          {payload.users_truncated && payload.invites_truncated
            ? "Only the most recently added users and invites are shown — the true totals may be higher."
            : payload.users_truncated
              ? "Only the most recently added users are shown — the true total may be higher."
              : "Only the most recently added invites are shown — the true total may be higher."}
        </p>
      )}

      <AddUserDialog
        open={open}
        onClose={() => setOpen(false)}
        onInvited={() => {
          setOpen(false);
          refresh();
        }}
      />

      {editing && (
        <EditUserDialog
          // Remounts the dialog per user, which re-runs its state
          // initialisers — see the note in that file about why it has no
          // re-seeding effect.
          key={editing.id}
          user={editing}
          open
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}

      {confirming && (
        <ConfirmDialog
          open
          title={confirming.title}
          description={confirming.description}
          body={confirming.body}
          confirmLabel={confirming.confirmLabel}
          onConfirm={runConfirmed}
          onClose={closeConfirm}
          busy={confirmBusy}
          error={confirmError}
        />
      )}

      <ErrorToastStack
        toasts={Object.entries(roleErrors).map(([id, message]) => ({
          key: id,
          message,
          onDismiss: () => setRoleError(id, null),
        }))}
      />
    </>
  );
}

/**
 * Per-row role select for an active user. Fully controlled by `role` (the
 * server-fetched value) rather than local optimistic state: on success the
 * parent refreshes the Server Component, which re-supplies the new `role`;
 * on failure nothing was changed locally, so the select naturally snaps back
 * to what the backend actually has once React re-renders — no manual revert
 * needed, and the operator sees the backend's own refusal message instead of
 * a silently-reverted control.
 */
function RoleCell({
  userId,
  userLabel,
  role,
  onChanged,
  onError,
}: {
  userId: string;
  userLabel: string;
  role: TeamRole;
  onChanged: () => void;
  onError: (userId: string, message: string | null) => void;
}) {
  const [pending, startTransition] = React.useTransition();

  function handleChange(next: TeamRole) {
    if (next === role) return;
    onError(userId, null);
    startTransition(async () => {
      const result = await setUserRole(userId, next);
      if (!result.ok) {
        // A 403 (not super-admin), 400 (self-demotion / last-super-admin),
        // or any other backend refusal must read as a refusal here, not a
        // silent no-op — the backend's message is written for an operator.
        //
        // Named, because the toast that carries this renders at the bottom of
        // the screen with no row to anchor it: with several members listed,
        // "You cannot remove your own super-admin role." alone doesn't say
        // whose row raised it.
        onError(userId, `Couldn't change the role for ${userLabel} — ${result.error}`);
        return;
      }
      onError(userId, null);
      onChanged();
    });
  }

  return (
    <Select
      aria-label="Change role"
      value={role}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value as TeamRole)}
      className="h-8 w-[168px] text-xs"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABEL[r]}
        </option>
      ))}
    </Select>
  );
}

function AddUserDialog({
  open,
  onClose,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<TeamRole>("order-manager");
  const [touched, setTouched] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const invalid = !/^\S+@\S+\.\S+$/.test(email);

  function reset() {
    setEmail("");
    setRole("order-manager");
    setTouched(false);
    setError(null);
  }

  function close() {
    if (pending) return;
    reset();
    onClose();
  }

  function submit() {
    setTouched(true);
    if (invalid) return;
    setError(null);
    startTransition(async () => {
      const result = await inviteUser(email.trim(), role);
      if (!result.ok) {
        // 409 (already a user / already pending / already accepted /
        // expired) or 403 (not super-admin) — keep the dialog open and show
        // the backend's own message rather than letting this read as a sent
        // invite. Never sent from anywhere except this explicit click.
        setError(result.error);
        return;
      }
      reset();
      onInvited();
    });
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Add User"
      description="Invite a teammate to the admin portal."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Sending…" : "Send Invite"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="user-email">Email</Label>
          <Input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@packaginggeneral.com"
            disabled={pending}
            aria-invalid={touched && invalid}
            aria-describedby={touched && invalid ? "user-email-error" : undefined}
          />
          {/* Field-level validation belongs UNDER its field. Only the server's
              refusal gets the alert box at the foot of the form. */}
          {touched && invalid && (
            <p id="user-email-error" className="text-xs leading-4 text-destructive">
              Enter a valid email address.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="user-role">Role</Label>
          <Select
            id="user-role"
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
            disabled={pending}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
          <p className="text-xs leading-4 text-muted">
            {ROLE_DESCRIPTION[role]}
          </p>
        </div>
        {error && <FormAlert>{error}</FormAlert>}
      </div>
    </Dialog>
  );
}
