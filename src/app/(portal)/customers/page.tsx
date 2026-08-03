import { unstable_rethrow } from "next/navigation";
import { CustomersScreen } from "@/components/customers/customers-screen";
import { getCustomers, type CustomersPayload } from "@/lib/data/customers";
import { AdminApiError } from "@/lib/medusa-admin";
import { isRangeKey } from "@/lib/customers-range";

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
async function loadCustomers(params: {
  start?: string;
  end?: string;
}): Promise<
  | { ok: true; payload: CustomersPayload }
  | { ok: false; reason: "invalid-range" | "unreachable" }
> {
  try {
    const payload = await getCustomers(params);
    return { ok: true, payload };
  } catch (err) {
    // adminFetch redirects to /login by THROWING a Next.js control-flow
    // error when the session cookie is missing/expired (see
    // lib/medusa-admin.ts, mirrored by the same rule in every other wired
    // screen's load helper). That must propagate — swallowing it here would
    // tell an operator "backend unreachable" when their session just died.
    unstable_rethrow(err);
    // A 400 is the backend rejecting THIS request's own params — a
    // hand-edited `?start=lastweek`, not an outage. The date bar itself can
    // only emit YYYY-MM-DD, so this branch is reachable only from a typed or
    // shared URL. Everything else (5xx, timeouts, DNS) is a real outage and
    // must keep the existing wording. Same split as `orders/page.tsx`.
    const reason =
      err instanceof AdminApiError && err.status === 400
        ? "invalid-range"
        : "unreachable";
    return { ok: false, reason };
  }
}

/**
 * Customers — Figma 3847:20531, wired to `GET /admin/pg/customers`.
 *
 * The URL owns the date range (`?start=&end=&range=`), exactly as `/orders`
 * owns its filters: the fetch AND the filter bar's displayed window derive
 * from the SAME values read here, so the control can never show a window
 * different from the one the rows actually came from. `range` carries only
 * which preset chip is highlighted — the dates themselves are authoritative,
 * so a stale or hand-edited chip key can't change what was fetched.
 *
 * Default is ALL TIME (no redirect to a default window, unlike the date bar's
 * previous home on Inventory): this screen's primary job is the full customer
 * directory, and silently showing a 30-day slice of it would read as "we have
 * 12 customers".
 */
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const start = str(sp.start) ?? "";
  const end = str(sp.end) ?? "";
  const rangeParam = str(sp.range) ?? "";
  const range = isRangeKey(rangeParam) ? rangeParam : null;

  const result = await loadCustomers({
    start: start || undefined,
    end: end || undefined,
  });

  if (!result.ok) {
    // Never render an empty table on failure — "no customers" and "we
    // couldn't load customers" must not look the same, and a screen showing
    // zero customers during an outage reads as staff having no customers.
    if (result.reason === "invalid-range") {
      return (
        <div className="rounded-panel border border-line bg-surface p-8 text-center">
          <p className="text-base font-semibold text-brand">
            Invalid date range
          </p>
          <p className="mt-1 text-sm text-muted">
            The dates in this link aren&apos;t in YYYY-MM-DD form — the backend
            is reachable, this URL just isn&apos;t.{" "}
            <a href="/customers" className="underline">
              Go back to all customers
            </a>{" "}
            or pick a range from the bar.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-panel border border-line bg-surface p-8 text-center">
        <p className="text-base font-semibold text-brand">
          Customers are unavailable
        </p>
        <p className="mt-1 text-sm text-muted">
          Could not reach the commerce backend. Customer figures are
          deliberately not shown rather than guessed. Reload once the
          backend is reachable.
        </p>
      </div>
    );
  }

  return (
    <CustomersScreen
      payload={result.payload}
      // The EXACT window that was fetched, not a preset key the client would
      // re-derive from "now" — re-deriving "last 30 days" client-side can
      // disagree with a window resolved moments (or days) earlier. See
      // `DateRangeSeed` in `lib/use-date-range.ts`.
      seed={{ start, end, range }}
    />
  );
}
