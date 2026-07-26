/**
 * Domain types for the admin portal.
 *
 * These are deliberately UI-shaped rather than Medusa-shaped: every screen reads
 * only from this module, so swapping the mock source in `mock.ts` for real
 * Medusa Admin API calls is a contained change (see `index.ts`).
 */

export type OrderStatus =
  | "new"
  | "in-progress"
  | "ready"
  | "delivered"
  | "cancelled";

/** Labels exactly as they appear in the Figma table + status chips. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  "in-progress": "In Progress",
  ready: "Ready for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Shorter labels used by the status count chips above the table. */
export const ORDER_STATUS_CHIP: Record<OrderStatus, string> = {
  new: "New",
  "in-progress": "In Progress",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** The stage each status advances to, or null when it is terminal. */
export const NEXT_STAGE: Record<OrderStatus, OrderStatus | null> = {
  new: "in-progress",
  "in-progress": "ready",
  ready: "delivered",
  delivered: null,
  cancelled: null,
};

export interface OrderCustomization {
  size: string;
  material: string;
  printing: string;
}

export interface ActivityEntry {
  id: string;
  actor: string;
  action: string;
  at: string; // ISO
}

export interface Order {
  id: string;
  /** Display id, e.g. "PG-2026-030". */
  number: string;
  product: string;
  /** Variant summary shown under the product name, e.g. "Medium (40×30×20cm)". */
  variant: string;
  quantity: number;
  total: number;
  status: OrderStatus;
  /** Team member id, or null when unassigned. */
  assignedTo: string | null;
  assignedAt: string | null;
  placedAt: string; // ISO
  customization: OrderCustomization;
  delivery: string;
  customerId: string;
  notes: string[];
  activity: ActivityEntry[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** Figma renders an em dash when a customer has no company. */
  company: string | null;
  orders: number;
}

export type TeamRole = "super-admin" | "admin" | "order-manager";

export const ROLE_LABEL: Record<TeamRole, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  "order-manager": "Order Manager",
};

/** Role legend rendered above the Team Members table. */
export const ROLE_DESCRIPTION: Record<TeamRole, string> = {
  "super-admin": "Super Admin — full access including user management",
  admin: "Admin — full access except user management",
  "order-manager": "Order Manager — orders & operations only",
};

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "active" | "pending";
  joinedAt: string; // ISO date
}

export type PromoStatus = "active" | "archived";

/**
 * Medusa campaign budget type.
 *   usage → cap on how many times the promotion can be applied
 *   spend → cap on the total discounted amount across all orders
 */
export type CampaignBudgetType = "usage" | "spend";

/**
 * A promo code as the Promotions screen models it.
 *
 * ⚠ CLIENT CONFIRMED 2026-07-25: this screen is the same thing as **Campaigns**
 * in the stock Medusa admin, with the same functionality. The mapping is:
 *
 *   name             → campaign.name
 *   code             → campaign.campaign_identifier  (the "Identifier
 *                      (Promotional Code)" field in the design)
 *   description      → campaign.description
 *   addedAt          → campaign.starts_at
 *   expiresAt        → campaign.ends_at
 *   budgetType       → campaign.budget.type          ("usage" | "spend")
 *   limit            → campaign.budget.limit
 *   used             → campaign.budget.used
 *   limitPerCustomer → usage budgets can be capped per customer/email
 *
 * The discount itself still lives on the Medusa *promotion* attached to the
 * campaign (`promotion.campaign_id`); this screen does not edit that yet.
 */
export interface PromoCode {
  id: string;
  code: string;
  name: string;
  description: string;
  addedAt: string;
  used: number;
  limit: number;
  expiresAt: string;
  status: PromoStatus;
  budgetType: CampaignBudgetType;
  /** null = unlimited uses per customer. Only meaningful when budgetType is "usage". */
  limitPerCustomer: number | null;
}

export interface PromoBanner {
  live: boolean;
  /** First line is the headline, subsequent lines the supporting text. */
  message: string;
}

/** Repeatable option rows in the ProductCreator panel. */
export interface SizeOption {
  id: string;
  label: string;
  priceMultiplier: number;
  length: number;
  width: number;
  height: number;
  unit: "mm" | "cm" | "m";
}

export interface MaterialOption {
  id: string;
  label: string;
  priceMultiplier: number;
  description: string;
}

export interface PrintOption {
  id: string;
  label: string;
  setupFee: number;
  pricePerUnit: number;
  description: string;
}

/**
 * ⚠ The Figma ProductCreator includes MOQ tiers (min/max qty + price
 * multiplier). Quantity price tiers were deliberately REMOVED from the
 * storefront + import pipeline on 2026-07-24 (single-price revert), so this
 * design reintroduces a concept the catalog no longer models. Built as designed;
 * confirm with the client before wiring it to the backend.
 */
export interface MoqTier {
  id: string;
  label: string;
  minQuantity: number;
  /** null = "No maximum". */
  maxQuantity: number | null;
  priceMultiplier: number;
}

export interface Product {
  id: string;
  name: string;
  basePrice: number;
  categorySlug: string;
  description?: string;
  imageUrl?: string | null;
  sizes?: SizeOption[];
  materials?: MaterialOption[];
  prints?: PrintOption[];
  tiers?: MoqTier[];
}

export interface PlatformSettings {
  currency: string;
  vatRate: number;
  nhilRate: number;
  getfundRate: number;
  platformFeePct: number;
  baseDeliveryFee: number;
}

/** Refund choice on the Cancel Order dialog. */
export type RefundMode = "full" | "partial" | "none";
