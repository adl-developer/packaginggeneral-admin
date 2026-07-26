"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { TeamRole } from "@/lib/data/types";

/**
 * The portal's top-level tabs. Visually identical to the Figma "TabsList"
 * (40px track, bg #c4bcb0, radius 16; 32px triggers, radius 14, active fill
 * #e8e5de) but each trigger is a real route link, not local state.
 *
 * ROLE GATING — the Figma frames show DIFFERENT tab sets on different screens
 * (the Users tab appears only on some), which matches the role legend on the
 * Team Members screen. So visibility is driven by role here:
 *   super-admin   → every tab
 *   admin         → everything except Users
 *   order-manager → Overview, Orders, Customers only
 *
 * ⚠ This hides navigation; it is NOT access control. Enforce the same rules on
 * the API before any of this is wired to real data.
 */
const TABS: { href: string; label: string; roles: TeamRole[] }[] = [
  {
    href: "/",
    label: "Overview",
    roles: ["super-admin", "admin", "order-manager"],
  },
  {
    href: "/orders",
    label: "Orders",
    roles: ["super-admin", "admin", "order-manager"],
  },
  {
    href: "/customers",
    label: "Customers",
    roles: ["super-admin", "admin", "order-manager"],
  },
  { href: "/promotions", label: "Promotions", roles: ["super-admin", "admin"] },
  { href: "/users", label: "Users", roles: ["super-admin"] },
  { href: "/settings", label: "Settings", roles: ["super-admin", "admin"] },
];

export function PortalTabs() {
  const pathname = usePathname();
  const { currentUser } = useAdmin();
  const visible = TABS.filter((t) => t.roles.includes(currentUser.role));

  return (
    <div className="overflow-x-auto pt-4">
      <nav
        aria-label="Admin sections"
        className="inline-flex h-10 items-center rounded-panel bg-line p-1"
      >
        {visible.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center justify-center rounded-button px-3",
                "text-sm font-medium leading-5 whitespace-nowrap transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                active
                  ? "bg-background text-brand"
                  : "text-muted hover:text-brand",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
