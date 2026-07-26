"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Package,
  XCircle,
} from "lucide-react";
import type { OrderStatus } from "@/lib/data/types";
import { ORDER_STATUS_CHIP } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/**
 * The five status count cards above the orders table — Figma 3835:19533.
 *
 * Card    230×86, bg #fefdfb, 1px #c4bcb0, radius 20; inner row gap 12,
 *         padding 16/16/24/16.
 * Tile    40×40, radius 16, padding 10, tinted per status; 20px icon.
 * Count   24px / 700 / lh24 / ls +0.07, #3d3428.
 * Label   12px / 400 / lh16, #7a7575.
 *
 * Tile fills and icon strokes are read straight from the design:
 *   New          #e2e1e0                  / #282827
 *   In Progress  rgba(164,154,135,0.2)    / #a49a87
 *   Ready        rgba(150,64,34,0.2)      / #964022
 *   Delivered    #282827  (solid dark)    / #f7f7f7
 *   Cancelled    #e2e1e0                  / rgba(40,40,39,0.6)
 *
 * Glyphs are matched to the Figma vector outlines (circle+hands → Clock,
 * circle+tick → CheckCircle2, circle+cross → XCircle, etc.).
 */
const CARDS: {
  status: OrderStatus;
  tile: string;
  icon: string;
  Icon: typeof Clock;
}[] = [
  {
    status: "new",
    tile: "bg-[#e2e1e0]",
    icon: "text-[#282827]",
    Icon: ClipboardList,
  },
  {
    status: "in-progress",
    tile: "bg-[rgba(164,154,135,0.2)]",
    icon: "text-[#a49a87]",
    Icon: Clock,
  },
  {
    status: "ready",
    tile: "bg-[rgba(150,64,34,0.2)]",
    icon: "text-[#964022]",
    Icon: Package,
  },
  {
    status: "delivered",
    tile: "bg-[#282827]",
    icon: "text-[#f7f7f7]",
    Icon: CheckCircle2,
  },
  {
    status: "cancelled",
    tile: "bg-[#e2e1e0]",
    icon: "text-[rgba(40,40,39,0.6)]",
    Icon: XCircle,
  },
];

export function StatusCountCards({
  counts,
  active,
  onSelect,
}: {
  counts: Record<OrderStatus, number>;
  active: OrderStatus | "";
  onSelect: (status: OrderStatus | "") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {CARDS.map(({ status, tile, icon, Icon }) => {
        const selected = active === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onSelect(selected ? "" : status)}
            aria-pressed={selected}
            className={cn(
              "flex items-center gap-3 rounded-card border bg-surface pt-4 pr-4 pb-6 pl-4 text-left",
              "transition-colors",
              selected
                ? "border-brand bg-[rgba(61,52,40,0.04)]"
                : "border-line hover:bg-line/20",
            )}
          >
            <span
              className={cn(
                "inline-flex size-10 shrink-0 items-center justify-center rounded-[16px]",
                tile,
              )}
            >
              <Icon className={cn("size-5", icon)} aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-2xl leading-6 font-bold text-brand">
                {counts[status]}
              </span>
              <span className="pt-1 text-xs leading-4 text-muted">
                {ORDER_STATUS_CHIP[status]}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
