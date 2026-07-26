import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/**
 * Order-status badge — Figma specs (Orders table): pad 2/12, radius full,
 * text 12px/600/lh16.
 *
 *   New                → bg #e2e1e0                  fg #282827
 *   In Progress        → bg rgba(164,154,135,0.3)    fg #282827
 *   Ready for Delivery → bg rgba(150,64,34,0.2)      fg #964022
 *   Cancelled          → bg #e2e1e0                  fg rgba(40,40,39,0.6)
 *
 * ⚠ "Delivered" does not appear in any Figma frame (the sample data has zero
 * delivered orders), so its treatment below is an inference — verify it against
 * the design before launch.
 *
 * Arbitrary colour values are used deliberately: `border-<token>/<opacity>` and
 * friends can silently fail to generate in Tailwind v4 (see the storefront's
 * CLAUDE.md border-colour gotcha).
 */
const TONE: Record<OrderStatus, string> = {
  new: "bg-[#e2e1e0] text-[#282827]",
  "in-progress": "bg-[rgba(164,154,135,0.3)] text-[#282827]",
  ready: "bg-[rgba(150,64,34,0.2)] text-[#964022]",
  delivered: "bg-[rgba(61,52,40,0.12)] text-[#3d3428]", // inferred — unverified
  cancelled: "bg-[#e2e1e0] text-[rgba(40,40,39,0.6)]",
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center rounded-full px-3",
        "text-xs font-semibold leading-4 whitespace-nowrap",
        TONE[status],
        className,
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
