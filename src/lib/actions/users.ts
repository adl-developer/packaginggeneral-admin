"use server";

import type { TeamRole } from "@/lib/data/types";
import { run, type ActionResult } from "./run";

export type { ActionResult };

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
 * ⚠ A successful call sends a real invite email via Medusa's
 * `createInvitesWorkflow` — only ever call this from an operator's explicit
 * "Send Invite" click, never from a script or test. The backend 409s (with a
 * distinct message each time) for an email that already has a user account,
 * an already-accepted invite, an already-pending invite, or an expired one —
 * `run()` surfaces that message verbatim so the caller can keep the dialog
 * open and show the real reason.
 */
export async function inviteUser(
  email: string,
  role: TeamRole,
): Promise<ActionResult> {
  return run("/admin/pg/users/invites", "POST", "/users", { email, role });
}
