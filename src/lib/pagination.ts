/**
 * Pure paging arithmetic for the Orders screen, directive-free so both the
 * Server Component (`orders/page.tsx`) and the client screen
 * (`components/orders/orders-screen.tsx`) can import it — the same reason
 * `date-range-math.ts` exists.
 *
 * The URL owns the page number, exactly as it owns the filters. Everything
 * here converts between that 1-based `?page=` and the backend's
 * `limit`/`offset`, and derives the "Showing X–Y of Z" label. Duplicating any
 * of it inside a component is how a pager ends up claiming a range the fetch
 * didn't actually return.
 */

/** Rows per page. Must stay ≤ the backend's MAX_LIMIT (100). */
export const ORDERS_PAGE_SIZE = 20;

/**
 * How many pages a result of `total` rows spans. Always at least 1, so an
 * empty result reads as "Page 1 of 1" rather than "Page 1 of 0".
 */
export function pageCount(total: number, limit: number): number {
  if (limit <= 0) return 1;
  return Math.max(1, Math.ceil(Math.max(0, total) / limit));
}

/**
 * A `?page=` value off the URL. Anything that isn't a whole number ≥ 1 — a
 * hand-edited "0", "abc", a repeated param — reads as page 1 rather than
 * producing a negative offset the backend would reject with a 400.
 */
export function parsePageParam(raw: string | undefined): number {
  if (!raw) return 1;
  const n = Number(raw.trim());
  if (!Number.isInteger(n) || n < 1) return 1;
  return n;
}

/** The backend `offset` for a 1-based page number. */
export function offsetForPage(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * limit;
}

/** Pull a page number back into range once the real total is known. */
export function clampPage(page: number, total: number, limit: number): number {
  return Math.min(Math.max(1, page), pageCount(total, limit));
}

export type ShowingRange = { from: number; to: number; total: number };

/**
 * The "Showing X–Y of Z" numbers, derived from what the fetch ACTUALLY
 * returned rather than from the requested page size — a short last page must
 * not claim a full one.
 */
export function showingRange(
  total: number,
  offset: number,
  returned: number,
): ShowingRange {
  if (returned <= 0 || total <= 0) {
    return { from: 0, to: 0, total: Math.max(0, total) };
  }
  return { from: offset + 1, to: offset + returned, total };
}

export function showingLabel(range: ShowingRange): string {
  if (range.total === 0) return "No orders";
  if (range.to === 0) return `0 of ${range.total.toLocaleString()} orders`;
  return `Showing ${range.from.toLocaleString()}–${range.to.toLocaleString()} of ${range.total.toLocaleString()}`;
}

export type OrdersLinkParams = {
  stage?: string;
  worker?: string;
  q?: string;
  page?: number;
};

/**
 * The canonical /orders URL for a filter + page combination.
 *
 * One builder for both the server redirect (page clamping) and every client
 * navigation, so a link produced by the pager and one produced by the redirect
 * are byte-identical. Page 1 omits `?page=` — that keeps the default URL clean
 * AND makes "reset to page 1 when a filter changes" the natural default rather
 * than something each call site has to remember.
 */
export function ordersHref(params: OrdersLinkParams): string {
  const qs = new URLSearchParams();
  if (params.stage) qs.set("stage", params.stage);
  if (params.worker) qs.set("worker", params.worker);
  if (params.q) qs.set("q", params.q);
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  const s = qs.toString();
  return `/orders${s ? `?${s}` : ""}`;
}
