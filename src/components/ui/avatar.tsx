import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

/**
 * Circular initials avatar used in the Customers and Team Members tables.
 * Figma: initials at 12px / 600, muted (#7a7575), on a light circular chip.
 */
export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      // Figma: 32×32 circle filled #c4bcb0, initials 12px/600 in #7a7575.
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
        "bg-line text-xs font-semibold text-muted",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
