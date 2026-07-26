import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Figma "Input": h36 (h32 in the compact filter bar), bg #fefdfb,
 * 1px #c4bcb0 border, radius 14, pad 4/12, text 14px/400, placeholder #7a7575.
 */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-9 w-full rounded-button border border-line bg-surface px-3",
      "text-sm text-brand placeholder:text-muted",
      "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-button border border-line bg-surface px-3 py-2",
      "text-sm leading-5 text-brand placeholder:text-muted",
      "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/** Native select styled to match Input (used by the status / worker filters). */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-9 w-full appearance-none rounded-button border border-line bg-surface",
      "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%237a7575%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')]",
      "bg-[length:16px_16px] bg-[right_10px_center] bg-no-repeat",
      "px-3 pr-8 text-sm text-brand",
      "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";

/** Figma "Label": 14px / 500 / lh14 / ls-0.15, colour #3d3428. */
export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-sm font-medium leading-[14px] text-brand",
        className,
      )}
      {...props}
    />
  );
}

/** Compact 12px/500 label used inside the date-filter bar. */
export function FilterLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-xs font-medium leading-4 text-muted", className)}
      {...props}
    />
  );
}
