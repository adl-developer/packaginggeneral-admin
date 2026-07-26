"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modal shell for the Order Detail (462px) and Add/Edit Product (462px) panels.
 * Dismisses on Escape and backdrop click; locks body scroll while open.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  width = 462,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  width?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(40,40,39,0.45)] p-4 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ maxWidth: width }}
        className={cn(
          "my-auto w-full rounded-card border border-line bg-surface shadow-header",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium leading-5 text-brand">{title}</p>
            {description && (
              <p className="text-sm leading-5 text-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 inline-flex size-8 items-center justify-center rounded-button text-muted transition-colors hover:bg-line/40 hover:text-brand"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="px-6 py-4">{children}</div>

        {footer && (
          <div className="flex flex-col gap-2 border-t border-line px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
