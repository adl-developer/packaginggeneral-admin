"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Shield, ShieldCheck, UserPlus } from "lucide-react";
import { RolePill } from "@/components/users/role-pill";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { inviteUser, setUserRole } from "@/lib/actions/users";
import type { UsersPayload } from "@/lib/data/users";
import { ROLE_DESCRIPTION, ROLE_LABEL, type TeamRole } from "@/lib/data/types";
import { useSession } from "@/lib/session-context";
import { formatDate } from "@/lib/utils";

const ROLES: TeamRole[] = ["super-admin", "admin", "order-manager"];

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
 */
export function UsersScreen({ payload }: { payload: UsersPayload }) {
  const router = useRouter();
  const currentUser = useSession();
  const [open, setOpen] = React.useState(false);

  const refresh = React.useCallback(() => router.refresh(), [router]);

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
            <Table>
              <THead tinted>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Status</TH>
                  <TH>Joined</TH>
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
                        role={u.role}
                        onChanged={refresh}
                      />
                    </TD>
                    <TD>
                      {/* Figma: solid brand fill for an active member. */}
                      <Badge tone="solid">Active</Badge>
                    </TD>
                    <TD className="text-xs whitespace-nowrap text-muted">
                      {formatDate(u.joined_at)}
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
                          the filled "active" badge above. */}
                      <Badge tone="outline">Pending</Badge>
                    </TD>
                    <TD className="text-xs whitespace-nowrap text-muted">
                      {formatDate(i.joined_at)}
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
  role,
  onChanged,
}: {
  userId: string;
  role: TeamRole;
  onChanged: () => void;
}) {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleChange(next: TeamRole) {
    if (next === role) return;
    setError(null);
    startTransition(async () => {
      const result = await setUserRole(userId, next);
      if (!result.ok) {
        // A 403 (not super-admin), 400 (self-demotion / last-super-admin),
        // or any other backend refusal must read as a refusal here, not a
        // silent no-op — the backend's message is written for an operator.
        setError(result.error);
        return;
      }
      onChanged();
    });
  }

  return (
    <div className="flex flex-col gap-1">
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
      {error && (
        <p role="alert" className="max-w-[220px] text-xs leading-4 text-destructive">
          {error}
        </p>
      )}
    </div>
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
          />
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
        {touched && invalid && (
          <p className="text-xs text-destructive">
            Enter a valid email address.
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
