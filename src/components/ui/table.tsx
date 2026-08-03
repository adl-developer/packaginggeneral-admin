import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Admin tables (Orders, Customers, Users, Promo codes).
 * Figma: rows separated by a 1px #c4bcb0 bottom border; header labels are
 * 12px/500 muted; body cells 14px. Rows are ~63px tall with 12px bottom padding.
 */

/**
 * `bleed` runs the table to the CARD's edges instead of stopping at its 24px
 * content padding — which is what Figma draws: the Inventory card is
 * `Card 1200x718 pad=0` holding a `CardHeader 1198 pad=24` and then rows of
 * `Table Row 1198x41 bg=196,188,176@0.3`. 1198 is the card's full inner width,
 * so the tinted header band and every row separator span it corner to corner.
 * Customers and Users are drawn the same way (`specs-customers.txt:30-32`,
 * `specs-users.txt:57`). Without this the band starts where the first label
 * starts and leaves a bare strip of card either side of it.
 *
 * Cell text does NOT move: the 24px the wrapper gives back with `-mx-6` is
 * re-applied to the first and last cells, so only the background and the row
 * rules get wider. The `[&_th:first-child]` form is deliberate — at (0,2,1) it
 * outranks the `first:pl-0` on TH/TD below, which is (0,2,0).
 *
 * ⚠ Only for a table inside a `CardContent` (its 24px `px-6` is what's being
 * cancelled) that keeps its bottom padding — a bled row sitting flush against
 * the card's last edge would square off the 20px corner radius.
 */
export function Table({
  className,
  bleed = false,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & { bleed?: boolean }) {
  return (
    <div className={cn("overflow-x-auto", bleed ? "-mx-6" : "w-full")}>
      <table
        className={cn(
          "w-full border-collapse text-left",
          bleed &&
            "[&_td:first-child]:pl-6 [&_td:last-child]:pr-6 [&_th:first-child]:pl-6 [&_th:last-child]:pr-6",
          className,
        )}
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
