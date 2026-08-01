"use client";

import { BackendUnreachable } from "@/components/layout/backend-unreachable";

/**
 * Root error boundary.
 *
 * This is the one that catches `(portal)/layout.tsx`'s `getCurrentUser()`
 * failure: Next's contract is that `error.tsx` handles its own segment's
 * CHILDREN, not that segment's own layout — so a throw inside the portal
 * layout bubbles past `(portal)/error.tsx` to here. Without this file, a dead
 * backend showed Next's built-in "Application error" page.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <BackendUnreachable error={error} reset={reset} />;
}
