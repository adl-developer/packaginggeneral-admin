"use client";

import * as React from "react";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The two ways this portal shows an operator that something was refused.
 *
 * Neither is in Figma — the design has no error states for these flows — so
 * both are built from the existing tokens rather than invented colours: the
 * `--color-destructive` pair for the accent, `--color-surface` and
 * `--shadow-header` for the raised toast, matching the Dialog.
 *
 * Which to use:
 *
 * - `FormAlert` when the operator is looking at the form that failed (a
 *   dialog). It sits with the fields it belongs to and stays until the form
 *   is resubmitted or closed.
 * - `ErrorToastStack` when the control that failed is IN a table row. Row
 *   controls have no room for a sentence — the "Change role" select is 168px
 *   wide in a column shared with the Status badge — and text injected there
 *   pushes the column out of line with every other row.
 */

/** Inline, form-scoped. Belongs next to the fields, not floating over them. */
export function FormAlert({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-button border border-[rgba(251,44,54,0.4)]",
        "bg-[rgba(231,0,11,0.06)] px-3 py-2",
        "text-xs leading-4 text-destructive",
        className,
      )}
    >
      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
      <span className="min-w-0">{children}</span>
    </div>
  );
}

export interface ErrorToast {
  /** Stable across re-renders — React key AND what keeps two live errors apart. */
  key: string;
  message: string;
  onDismiss: () => void;
}

/**
 * A STACK, not a single toast. Two row actions can fail independently before
 * either is read (claim an order, then open a different order's dialog), and
 * reusing one fixed position used to render them on top of each other. Every
 * live error renders, gapped, each dismissible on its own.
 *
 * Deliberately never auto-dismisses: these are refusals the operator has to
 * read to know their change did not happen.
 */
export function ErrorToastStack({ toasts }: { toasts: ErrorToast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div
      // pointer-events-none on the container so the empty space beside a
      // narrow toast doesn't swallow clicks on the page underneath.
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] mx-auto flex w-fit max-w-[90vw] flex-col items-center gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.key}
          role="alert"
          className={cn(
            "pointer-events-auto flex max-w-[420px] items-start gap-3",
            "rounded-button border border-[rgba(251,44,54,0.4)] bg-surface",
            "px-4 py-3 text-sm leading-5 text-brand shadow-header",
          )}
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden
          />
          <span className="min-w-0 flex-1">{t.message}</span>
          <button
            type="button"
            onClick={t.onDismiss}
            aria-label="Dismiss"
            className="-mr-1 shrink-0 rounded-full p-0.5 text-muted transition-colors hover:text-brand"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
