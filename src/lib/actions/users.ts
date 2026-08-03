"use server";

import type { TeamRole } from "@/lib/data/types";
// ⚠ Do NOT re-export a type from a "use server" file — see the note in
// ./orders.ts. It becomes a runtime export and the module throws
// ReferenceError at request time, with all four local checks still green.
import { run, type ActionResult } from "./run";

/**
 * User/role/invite mutations behind the Users screen.
 *
 * ⚠ `setUserRole` PATCHes `/admin/pg/users/:id/role` — NOT POST. Confirmed
 * against `backend/src/api/admin/pg/users/[id]/role/route.ts`'s own header
 * comment: the framework route loader accepts PATCH as a named export, and
 * PATCH is the correct verb for a partial update of one field on an existing
 * resource. The backend refuses this call for anyone below super-admin
 * (403), for a super-admin demoting themselves (400), and for a demotion
 * that would leave no super-admin at all (400) — `run()` surfaces the
 * backend's own message for all three rather than a generic failure, and the
 * caller must not treat a failed result as if the role changed.
 */
export async function setUserRole(
  id: string,
  role: TeamRole,
): Promise<ActionResult> {
  return run(`/admin/pg/users/${id}/role`, "PATCH", "/users", { role });
}

/**
 * Invite a new portal user.
 *
 * ⚠ A successful call creates the invite AND sends a real invitation email —
 * only ever call this from an operator's explicit "Send Invite" click, never
 * from a script or test. The backend 409s (with a distinct message each time)
 * for an email that already has a user account, an already-accepted invite,
 * an already-pending invite, or an expired one — `run()` surfaces that
 * message verbatim so the caller can keep the dialog open and show the real
 * reason.
 *
 * ⚠ Corrected 2026-08-02: this comment used to claim the email was sent by
 * `createInvitesWorkflow`. It wasn't — nothing subscribed to `invite.created`
 * (Medusa core's only bundled notification subscriber is hard-coded to
 * `order.created`), so every invite ever sent from this screen created a row
 * whose token reached nobody. `backend/src/subscribers/invite-email.ts` now
 * delivers it; the email module still has to be configured, and the backend
 * logs a loud warning when it isn't.
 */
export async function inviteUser(
  email: string,
  role: TeamRole,
): Promise<ActionResult> {
  return run("/admin/pg/users/invites", "POST", "/users", { email, role });
}

/**
 * Rename a user.
 *
 * ⚠ Name only. A user's EMAIL is not editable anywhere in the portal, and the
 * backend 400s if you send one: `user.email` is not the login credential —
 * that lives on the auth identity's emailpass record — so writing one without
 * the other leaves the portal showing an address the person cannot sign in
 * with. See the backend route's header.
 */
export async function updateUser(
  id: string,
  fields: { first_name: string; last_name: string },
): Promise<ActionResult> {
  return run(`/admin/pg/users/${id}`, "PATCH", "/users", fields);
}

/**
 * Remove a user's portal access entirely — deletes the account AND unlinks its
 * auth identity, so the person can no longer sign in.
 *
 * ⚠ Irreversible, and not undoable from the portal: only ever call this behind
 * an explicit confirmation. The backend refuses it for anyone below
 * super-admin (403), for removing your own account (400), and for removing the
 * last remaining super admin (400).
 *
 * ⚠ There is no "suspend" counterpart, deliberately — Medusa users have no
 * active flag and a metadata one would be enforced by nothing, leaving a
 * "suspended" person still able to authenticate. See the backend route.
 */
export async function deleteUser(id: string): Promise<ActionResult> {
  return run(`/admin/pg/users/${id}`, "DELETE", "/users");
}

/**
 * Revoke a pending invite. A real security action, not tidying: an unaccepted
 * invite's token grants whoever holds it an admin account until it expires.
 * The backend 409s if the invite has already been accepted (the account
 * exists — remove the user instead).
 */
export async function revokeInvite(id: string): Promise<ActionResult> {
  return run(`/admin/pg/users/invites/${id}`, "DELETE", "/users");
}

/**
 * Reissue a pending invite's token and email it again.
 *
 * ⚠ This INVALIDATES the previous link — correct for a credential, but it
 * means an invitee who still had the first email open loses it. Say so in the
 * UI before calling. Sends a real email; operator-initiated only.
 */
export async function resendInvite(id: string): Promise<ActionResult> {
  return run(`/admin/pg/users/invites/${id}/resend`, "POST", "/users");
}
