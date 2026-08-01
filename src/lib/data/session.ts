import { adminFetch } from "@/lib/medusa-admin";
import type { TeamRole } from "@/lib/data/types";

/**
 * Current admin user. Mirrors `GET /admin/pg/me` — keep in step with
 * `backend/src/api/admin/pg/me/route.ts`.
 */
export type SessionUser = {
  id: string;
  name: string;
  email: string | null;
  role: TeamRole;
};

export async function getCurrentUser(): Promise<SessionUser> {
  return adminFetch<SessionUser>("/admin/pg/me");
}
