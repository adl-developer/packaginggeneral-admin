"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

/**
 * The panel every uncaught render failure lands on.
 *
 * Without an error boundary anywhere under `src/app`, a backend outage was
 * caught by Next's built-in "Application error: a server-side exception has
 * occurred" screen — so the six hand-written failure panels (Overview,
 * Orders, Customers, Users, Settings, Inventory) never rendered in the one
 * situation they were written for. `(portal)/layout.tsx` in particular calls
 * `getCurrentUser()` with a deliberate no-try/catch, and an error thrown in a
 * layout can only be caught by a boundary ABOVE it — hence `app/error.tsx` as
 * well as `app/(portal)/error.tsx`.
 *
 * Copy deliberately matches those panels: say the backend is unreachable, say
 * the figures are withheld rather than guessed, and offer a retry. Never
 * imply the portal is showing anything real.
 */
export function BackendUnreachable({
  error,
  reset,
  title = "The portal can't reach the backend",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  // Do not swallow it: the boundary renders honest copy for the operator, the
  // console/Sentry keeps the real cause for whoever has to fix it.
  React.useEffect(() => {
    console.error("[admin] unhandled render error", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-16">
      <div className="rounded-panel border border-line bg-surface p-8 text-center">
        <p className="text-base font-semibold text-brand">{title}</p>
        <p className="mt-1 text-sm text-muted">
          Nothing on this screen could be loaded. Figures, orders and stock
          levels are deliberately not shown rather than guessed — a portal
          showing invented numbers is worse than one showing an error. Try
          again once the commerce backend is reachable.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <a
            href="/login"
            className="text-sm text-muted underline transition-colors hover:text-brand"
          >
            Sign in again
          </a>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-muted">
            Reference for support: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
