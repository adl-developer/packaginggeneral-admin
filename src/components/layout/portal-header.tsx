"use client";

import { AdminHeader } from "./admin-header";
import { useSession } from "@/lib/session-context";

/** Feeds the signed-in user from the session into the presentational header. */
export function PortalHeader() {
  const currentUser = useSession();
  return (
    <AdminHeader
      user={{ name: currentUser.name, email: currentUser.email ?? "" }}
    />
  );
}
