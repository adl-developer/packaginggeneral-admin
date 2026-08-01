"use client";

import * as React from "react";
import type { SessionUser } from "@/lib/data/session";

/**
 * The signed-in user, provided by the portal layout (a Server Component) so
 * client components can gate on role without a fetch of their own.
 *
 * ⚠ Role here drives NAVIGATION VISIBILITY only. Real permissions are
 * enforced on the API — see the cancel/refund route.
 */
const SessionContext = React.createContext<SessionUser | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionUser {
  const value = React.useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used inside <SessionProvider>");
  }
  return value;
}
