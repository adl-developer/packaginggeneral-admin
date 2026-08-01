import type { OrderStatus } from "@/lib/data/types";

/**
 * The backend's order-ops stages and the portal's OrderStatus are the same
 * five states spelled differently (`in_progress` vs `in-progress`,
 * `ready_for_delivery` vs `ready`). Converting in one tested place stops the
 * two vocabularies leaking into screens as ad-hoc string replacement.
 */
export type OrderStage =
  | "new"
  | "in_progress"
  | "ready_for_delivery"
  | "delivered"
  | "cancelled";

const TO_STATUS: Record<OrderStage, OrderStatus> = {
  new: "new",
  in_progress: "in-progress",
  ready_for_delivery: "ready",
  delivered: "delivered",
  cancelled: "cancelled",
};

const TO_STAGE: Record<OrderStatus, OrderStage> = {
  new: "new",
  "in-progress": "in_progress",
  ready: "ready_for_delivery",
  delivered: "delivered",
  cancelled: "cancelled",
};

/** Unknown stages read as "new" — an order that exists but was never touched. */
export function stageToStatus(stage: string): OrderStatus {
  return TO_STATUS[stage as OrderStage] ?? "new";
}

export function statusToStage(status: OrderStatus): OrderStage {
  return TO_STAGE[status];
}
