import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Figma "Badge": h22, pad 2/10, 1px #c4bcb0 border, full radius,
 * text 12px / 600 / lh16 / ls0, colour #3d3428.
 *
 * NOTE: every badge in the admin design is OUTLINE — order status is conveyed
 * by the label text ("new", "in-progress", "delivered"), never by fill colour.
 * `tone="solid"` exists only for the few filled counters in the Orders screen.
 */
export function Badge({
  className,
  tone = "outline",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "outline" | "solid" }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center rounded-full px-2.5",
        "text-xs font-semibold leading-4 whitespace-nowrap",
        tone === "outline"
          ? "border border-line text-brand"
          : "bg-brand text-brand-foreground",
        className,
      )}
      {...props}
    />
  );
}
