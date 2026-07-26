"use client";

import * as React from "react";
import { ClipboardList, Shield, ShieldCheck, UserPlus } from "lucide-react";
import { RolePill } from "@/components/users/role-pill";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import {
  ROLE_DESCRIPTION,
  ROLE_LABEL,
  type TeamRole,
} from "@/lib/data/types";
import { useAdmin } from "@/lib/store";

const ROLES: TeamRole[] = ["super-admin", "admin", "order-manager"];

/** Legend glyphs mirror the role-pill icons, but muted (Figma: all #7a7575). */
const LEGEND_ICON: Record<TeamRole, typeof Shield> = {
  "super-admin": ShieldCheck,
  admin: Shield,
  "order-manager": ClipboardList,
};

/**
 * Team Members — Figma 3803:3429.
 *
 * ⚠ Specs for this frame were NOT pulled from Figma (the REST quota ran out
 * mid-extraction), so geometry comes from the cached node tree and styling from
 * the verified token set. Re-run storefront/scripts/pull-admin-specs.ps1 and do
 * a parity pass here.
 */
export default function UsersPage() {
  const { team, currentUser, addTeamMember } = useAdmin();
  const [open, setOpen] = React.useState(false);

  const active = team.filter((m) => m.status === "active").length;
  const pending = team.filter((m) => m.status === "pending").length;

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
                {active} active · {pending} pending invite
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
              {team.map((m) => (
                <TR key={m.id}>
                  <TD>
                    <span className="flex items-center gap-3">
                      <Avatar name={m.name} />
                      <span className="font-medium">
                        {m.name}
                        {m.id === currentUser.id && (
                          <span className="ml-1 text-xs font-normal text-muted">
                            (you)
                          </span>
                        )}
                      </span>
                    </span>
                  </TD>
                  <TD className="text-muted">{m.email}</TD>
                  <TD>
                    <RolePill role={m.role} />
                  </TD>
                  <TD>
                    {/* Figma: solid brand fill, not the outline badge. */}
                    <Badge tone="solid">{m.status}</Badge>
                  </TD>
                  {/* Figma shows the raw ISO date here (2025-06-01), 12px muted. */}
                  <TD className="text-xs whitespace-nowrap text-muted">
                    {m.joinedAt}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <AddUserDialog
        open={open}
        onClose={() => setOpen(false)}
        onAdd={(member) => {
          addTeamMember(member);
          setOpen(false);
        }}
      />
    </>
  );
}

function AddUserDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (m: {
    id: string;
    name: string;
    email: string;
    role: TeamRole;
    status: "pending";
    joinedAt: string;
  }) => void;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<TeamRole>("order-manager");
  const [touched, setTouched] = React.useState(false);

  const invalid = !name.trim() || !/^\S+@\S+\.\S+$/.test(email);

  const submit = () => {
    setTouched(true);
    if (invalid) return;
    onAdd({
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      status: "pending",
      joinedAt: new Date().toISOString().slice(0, 10),
    });
    setName("");
    setEmail("");
    setRole("order-manager");
    setTouched(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add User"
      description="Invite a teammate to the admin portal."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Send Invite</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="user-name">Name</Label>
          <Input
            id="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kwame Mensah"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="user-email">Email</Label>
          <Input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@packaginggeneral.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="user-role">Role</Label>
          <Select
            id="user-role"
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
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
            Enter a name and a valid email address.
          </p>
        )}
      </div>
    </Dialog>
  );
}
