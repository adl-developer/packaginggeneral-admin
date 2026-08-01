"use client";

import { BackendUnreachable } from "@/components/layout/backend-unreachable";

/**
 * Portal error boundary — catches a throw from any portal PAGE (Overview,
 * Orders, Customers, Users, Settings, Inventory, Promotions) and renders
 * inside the shell, so the header and tabs survive and the operator can move
 * to a screen that still works.
 *
 * A throw from `(portal)/layout.tsx` itself cannot be caught here (Next only
 * lets a parent boundary handle a layout's own errors) — `app/error.tsx`
 * covers that case.
 *
 * Most screens already catch their own fetch failure and render a specific
 * panel; this is the backstop for anything they don't anticipate.
 */
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <BackendUnreachable
      error={error}
      reset={reset}
      title="This screen couldn't be loaded"
    />
  );
}
