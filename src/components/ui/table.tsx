import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Admin tables (Orders, Customers, Users, Promo codes).
 * Figma: rows separated by a 1px #c4bcb0 bottom border; header labels are
 * 12px/500 muted; body cells 14px. Rows are ~63px tall with 12px bottom padding.
 */

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-left", className)}
        {...props}
      />
    </div>
  );
}

/**
 * `tinted` matches the Customers/Users tables, whose header row is a 40px band
 * filled rgba(196,188,176,0.3). The Orders table header is NOT tinted (48px,
 * plain) — pass nothing there.
 */
export function THead({
  className,
  tinted = false,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & { tinted?: boolean }) {
  return (
    <thead
      className={cn(
        tinted &&
          "[&_tr]:h-10 [&_tr]:bg-[rgba(196,188,176,0.3)] [&_th]:px-3 [&_th]:pb-0 [&_th]:align-middle",
        className,
      )}
      {...props}
    />
  );
}

export function TBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TR({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("border-b border-line last:border-b-0", className)}
      {...props}
    />
  );
}

export function TH({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      // Figma: 12px / 600 / lh16 / ls +0.3, colour #7a7575.
      className={cn(
        "px-3 pb-3 text-xs font-semibold leading-4 tracking-[0.3px] text-muted first:pl-0 last:pr-0",
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-3 py-4 align-middle text-sm leading-5 text-brand first:pl-0 last:pr-0",
        className,
      )}
      {...props}
    />
  );
}
