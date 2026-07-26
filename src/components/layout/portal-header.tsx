"use client";

import { AdminHeader } from "./admin-header";
import { useAdmin } from "@/lib/store";

/** Feeds the signed-in user from the store into the presentational header. */
export function PortalHeader() {
  const { currentUser } = useAdmin();
  return (
    <AdminHeader
      user={{ name: currentUser.name, email: currentUser.email }}
    />
  );
}
