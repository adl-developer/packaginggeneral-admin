"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";
import * as React from "react";
import { logout } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

/**
 * Figma: 69px bar (68 + 1px bottom border), bg #fefdfb, border #c4bcb0.
 * Container 1280 with 16px padding. Logo lockup 165×36. Account button
 * 147×32, bg #e8e5de, 1px line, radius 14, pad 0/10, gap 8.
 *
 * Presentational on purpose — the login screen renders it with no user, and the
 * portal wraps it in <PortalHeader/> to feed the signed-in user from the store.
 */
export function AdminHeader({
  user,
}: {
  user?: { name: string; email: string };
}) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-[68px] w-full max-w-[1280px] items-center justify-between px-4">
        <Link
          href={user ? "/" : "/login"}
          className="flex items-center gap-2 rounded-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <Image
            src="/logo.png"
            alt=""
            width={30}
            height={36}
            priority
            className="h-9 w-auto"
          />
          <span className="flex flex-col">
            <span className="text-base font-bold leading-5 text-brand">
              Packaging General
            </span>
            <span className="text-xs leading-4 text-muted">Admin Portal</span>
          </span>
        </Link>

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="menu"
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-button border border-line bg-background px-2.5",
                "text-sm font-medium leading-5 text-brand transition-colors hover:bg-line/40",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
              )}
            >
              <User className="size-4 shrink-0" aria-hidden />
              {user.name}
              <ChevronDown className="size-3 shrink-0" aria-hidden />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-56 rounded-card border border-line bg-surface p-1 shadow-header"
              >
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium text-brand">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
                <div className="my-1 h-px bg-line" />
                {/* Server action so the httpOnly session cookie is actually
                    cleared — a plain link to /login would leave it set. */}
                <form action={logout}>
                  <button
                    type="submit"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-button px-3 py-2 text-left text-sm text-brand transition-colors hover:bg-line/40"
                  >
                    <LogOut className="size-4" aria-hidden />
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <span className="inline-flex h-8 items-center gap-2 rounded-button border border-line bg-background px-2.5 text-sm font-medium leading-5 text-brand">
            <User className="size-4 shrink-0" aria-hidden />
            Account
          </span>
        )}
      </div>
    </header>
  );
}
