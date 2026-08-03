import { adminFetch } from "@/lib/medusa-admin";

/**
 * Platform Settings read seam — Settings → Platform.
 *
 * Mirrors `backend/src/api/admin/pg/settings/platform/route.ts`. The three
 * levies are configurable; currency and delivery fees come back read-only and
 * the backend explains why.
 */

export type Levies = { vat: number; nhil: number; getfund: number };

export type PlatformPayload = {
  currency_code: string;
  tax_rate: {
    id: string;
    name: string | null;
    code: string | null;
    /** The single rate Medusa actually charges on every Ghana order. */
    charged_rate: number;
  };
  levies: Levies;
  /** Sum of the three — what the charged rate becomes on the next save. */
  effective_rate: number;
  /**
   * `ok: false` when the stored split does NOT sum to the rate being charged.
   * This is the live state today: the region was seeded at 21.9% (pre-Act
   * 1151) and carries no split, so invoices itemise 20 while orders are
   * charged 21.9. The screen must show that, not hide it.
   */
  reconciliation:
    | { ok: true }
    | { ok: false; chargedRate: number; levyTotal: number };
  shipping_options: { id: string; name: string; price_type: string }[];
};

export async function getPlatformSettings(): Promise<PlatformPayload> {
  return adminFetch<PlatformPayload>("/admin/pg/settings/platform");
}
