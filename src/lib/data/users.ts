import { adminFetch } from "@/lib/medusa-admin";
import type { TeamRole } from "@/lib/data/types";

/**
 * Users read seam. Mirrors `GET /admin/pg/users` — keep in step with
 * `backend/src/api/admin/pg/users/route.ts`.
 *
 * Medusa has no role column, so a portal role rides on `user.metadata.role`
 * (and `invite.metadata.role` for a pending invite) — the backend resolves it
 * server-side so this module and the backend can never disagree about what a
 * blank metadata value means. See that route's header comment for the full
 * reasoning, including why users and invites are two separate, independently
 * truncatable lists rather than one merged scan.
 */

export type UserRow = {
  id: string;
  name: string;
  email: string | null;
  role: TeamRole;
  status: "active";
  joined_at: string;
};

export type InviteRow = {
  id: string;
  email: string;
  role: TeamRole;
  status: "pending";
  joined_at: string;
};

export type UsersPayload = {
  users: UserRow[];
  invites: InviteRow[];
  total_users: number;
  /** True when more users exist than the backend's defensive scan cap
   *  returned. On a screen whose whole purpose is auditing who has access, a
   *  silently dropped row is the one failure mode that can't be allowed to
   *  be silent — this must be surfaced, not swallowed. */
  users_truncated: boolean;
  total_invites: number;
  /** Same truncation signal as `users_truncated`, scoped to pending invites —
   *  the two lists truncate independently (see the backend route comment). */
  invites_truncated: boolean;
};

export async function getTeam(): Promise<UsersPayload> {
  return adminFetch<UsersPayload>("/admin/pg/users");
}

/** A colleague an order can be assigned to. Only what a picker needs. */
export type Worker = { id: string; name: string };

/**
 * The staff roster, for screens that need to OFFER a colleague rather than
 * audit the team — currently the Orders screen's worker filter.
 *
 * Only accepted accounts: a pending invite has no user id yet, so it can hold
 * no assignment and would be an option that always returns zero orders.
 */
export async function getWorkers(): Promise<Worker[]> {
  const team = await getTeam();
  return team.users.map((u) => ({ id: u.id, name: u.name }));
}
