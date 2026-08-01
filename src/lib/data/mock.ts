/**
 * Mock fixtures for the two screens still on fixtures — Promotions and
 * Settings → Platform (both Spec 2; see `lib/data/index.ts`'s header for the
 * split). Transcribed verbatim from the Figma "New Admin Designs" frames so
 * those screens render the same numbers as the designs.
 *
 * Task 17 (2026-08-01) removed the Orders/Customers/Users/Products fixtures
 * that used to live here — those screens now read live Medusa data (see
 * `orders.ts`, `customers.ts`, `users.ts`, `products.ts`), so their sample
 * data had no reader left and was deleted rather than kept as dead code.
 */
import type { PlatformSettings, PromoBanner, PromoCode } from "./types";

export const PROMO_CODES: PromoCode[] = [
  {
    id: "promo_launch",
    code: "LAUNCH20",
    name: "Launch Special",
    description: "20% off for early customers",
    addedAt: "2026-01-01",
    used: 47,
    limit: 200,
    expiresAt: "2026-08-31",
    status: "active",
    budgetType: "usage",
    limitPerCustomer: 1,
  },
  {
    id: "promo_sme",
    code: "SME15",
    name: "SME Discount",
    description: "15% off for SME orders",
    addedAt: "2026-03-01",
    used: 112,
    limit: 500,
    expiresAt: "2026-12-31",
    status: "active",
    budgetType: "usage",
    limitPerCustomer: 1,
  },
  {
    id: "promo_spend",
    code: "SPEND500",
    name: "Q1 Spend Campaign",
    description: "GH₵500 off spend campaigns",
    addedAt: "2025-12-15",
    used: 89,
    limit: 50000,
    expiresAt: "2026-03-31",
    status: "archived",
    // "GH₵500 off spend campaigns" with a 50,000 limit — a spend budget.
    budgetType: "spend",
    limitPerCustomer: null,
  },
];

export const PROMO_BANNER: PromoBanner = {
  live: true,
  message: "Enjoy 10% off for all Easter orders Code: PGEASTER",
};

/**
 * Ghana 2026 VAT reform (Act 1151): VAT 15% + NHIL 2.5% + GETFund 2.5% with no
 * cascading = 20% effective. The Figma Settings screen lists exactly these three
 * component rates, so it is consistent with the reform.
 */
export const PLATFORM_SETTINGS: PlatformSettings = {
  currency: "GHS",
  vatRate: 15,
  nhilRate: 2.5,
  getfundRate: 2.5,
  platformFeePct: 5,
  baseDeliveryFee: 50,
};

/** Category options offered by the (not-yet-connected) ProductCreator form. */
export const PRODUCT_CATEGORIES = [
  { slug: "rsc-cartons", label: "RSC Cartons" },
  { slug: "die-cut-boxes", label: "Die Cut Boxes" },
  { slug: "food-packaging", label: "Food Packaging" },
  { slug: "packaging-accessories", label: "Packaging Accessories" },
  { slug: "tape", label: "Tape" },
  { slug: "bubble-wrap", label: "Bubble Wrap" },
  { slug: "shrink-wrap", label: "Shrink Wrap" },
  { slug: "stuffing", label: "Stuffing" },
];
