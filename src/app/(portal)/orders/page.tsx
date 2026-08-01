import { redirect, unstable_rethrow } from "next/navigation";
import { OrdersScreen } from "@/components/orders/orders-screen";
import { getOrders, type OrdersListPayload } from "@/lib/data/orders";
import { AdminApiError } from "@/lib/medusa-admin";
import {
  ORDERS_PAGE_SIZE,
  clampPage,
  offsetForPage,
  ordersHref,
  parsePageParam,
} from "@/lib/pagination";

/** Live Medusa data — never cache. */
export const dynamic = "force-dynamic";

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

/**
 * Isolated from the returned JSX on purpose, same reasoning as
 * `inventory/page.tsx`'s `loadInventory`: eslint's react-hooks rule
 * (correctly) flags constructing JSX inside a try/catch, since React doesn't
 * render synchronously and the catch would never see a render error anyway.
 */
async function loadOrders(params: {
  stage?: string;
  worker?: string;
  q?: string;
  limit: number;
  offset: number;
}): Promise<
  | { ok: true; payload: OrdersListPayload }
  | { ok: false; reason: "invalid-filter" | "unreachable" }
> {
  try {
    const payload = await getOrders(params);
    return { ok: true, payload };
  } catch (err) {
    // adminFetch redirects to /login by THROWING a Next.js control-flow
    // error when the session cookie is missing/expired (see
    // lib/medusa-admin.ts, mirrored by the same rule in
    // lib/actions/orders.ts's `run()`/`fetchOrderDetail()`). That must
    // propagate — swallowing it here would tell an operator "backend
    // unreachable" when their session just died.
    unstable_rethrow(err);
    // A 400 means the backend rejected THIS request's own query params — the
    // operator's own typo (a hand-edited URL), not an outage. Concretely that
    // is an unrecognised `?stage=`, or a `limit`/`offset` outside the bounds
    // the route documents, which `orders-ops/route.ts` validates and rejects
    // rather than silently ignoring (an unrecognised stage used to return the
    // FULL list under a filtered-looking UI, which also made this branch dead
    // code). Everything else (5xx, timeouts, DNS/connection failures) is a
    // real "can't reach the backend" and must keep the existing wording.
    const reason =
      err instanceof AdminApiError && err.status === 400
        ? "invalid-filter"
        : "unreachable";
    return { ok: false, reason };
  }
}

/**
 * Order Management — Server Component. The URL owns `stage`/`worker`/`q` AND
 * `page` (see `OrdersScreen`'s file comment for why): both the fetch AND the
 * rendered chip/banner/pager state derive from the SAME values read here, so
 * they can never describe different scopes.
 */
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const stage = str(sp.stage) ?? "";
  const worker = str(sp.worker) ?? "";
  const q = str(sp.q) ?? "";
  const page = parsePageParam(str(sp.page));

  const result = await loadOrders({
    stage: stage || undefined,
    worker: worker || undefined,
    q: q || undefined,
    limit: ORDERS_PAGE_SIZE,
    offset: offsetForPage(page, ORDERS_PAGE_SIZE),
  });

  // A bookmarked or shared link can point past the end of a result that has
  // since shrunk (or of a different filter). Redirect to the last real page
  // rather than rendering an empty table under a URL claiming page 5 — an
  // empty table is how "no orders match" looks, and the two must not be
  // confusable. Clamping terminates: the target is always ≤ the last page,
  // and page 1 always exists.
  if (result.ok) {
    const clamped = clampPage(page, result.payload.count, result.payload.limit);
    if (clamped !== page) {
      redirect(ordersHref({ stage, worker, q, page: clamped }));
    }
  }

  if (!result.ok) {
    // An orders screen that renders an empty table on failure would read as
    // "no orders" — indistinguishable from a genuinely quiet day. Fail
    // visibly instead, with copy matched to the actual cause: a bad URL is
    // the operator's own typo, not an outage.
    if (result.reason === "invalid-filter") {
      return (
        <div className="rounded-panel border border-line bg-surface p-8 text-center">
          <p className="text-base font-semibold text-brand">Invalid filter</p>
          <p className="mt-1 text-sm text-muted">
            The status filter in this link isn&apos;t one the backend
            recognises — the backend is reachable, this URL just isn&apos;t.{" "}
            <a href="/orders" className="underline">
              Go back to all orders
            </a>{" "}
            or fix the filters in the bar above.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-panel border border-line bg-surface p-8 text-center">
        <p className="text-base font-semibold text-brand">
          Orders are unavailable
        </p>
        <p className="mt-1 text-sm text-muted">
          Could not reach the commerce backend. Order figures are
          deliberately not shown rather than guessed. Reload once the
          backend is reachable.
        </p>
      </div>
    );
  }

  return (
    <OrdersScreen
      payload={result.payload}
      filters={{ stage, worker, q, page }}
    />
  );
}
