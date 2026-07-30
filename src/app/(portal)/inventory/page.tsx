import { redirect, unstable_rethrow } from "next/navigation";
import { getInventory, type InventoryPayload } from "@/lib/data/inventory";
import { InventoryScreen } from "@/components/inventory/inventory-screen";
import type { RangeKey } from "@/components/layout/date-filter-bar";

/** Live Medusa data — never cache. */
export const dynamic = "force-dynamic";

const PRESET_KEYS = ["7d", "30d", "60d", "90d"] as const;
type PresetKey = (typeof PRESET_KEYS)[number];

function isPresetKey(v: unknown): v is PresetKey {
  return typeof v === "string" && (PRESET_KEYS as readonly string[]).includes(v);
}

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

const PRESET_KEYS_DAYS: Record<PresetKey, number> = {
  "7d": 7,
  "30d": 30,
  "60d": 60,
  "90d": 90,
};

/**
 * "N days back, inclusive of today" — the exact same formula as the client's
 * `presetRange` in lib/use-date-range.ts. NOT imported from there: that file
 * is `"use client"`, and every export of a client-directive module becomes
 * an opaque client reference once pulled into a Server Component — a plain
 * exported function stops being callable server-side. Duplicating three
 * lines of date arithmetic here is cheaper and safer than restructuring an
 * already-reviewed client module just to share it.
 */
function defaultRangeParams(): URLSearchParams {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - (PRESET_KEYS_DAYS["30d"] - 1));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const qs = new URLSearchParams();
  qs.set("start", iso(from));
  qs.set("end", iso(today));
  qs.set("range", "30d");
  return qs;
}

/**
 * Isolated from the returned JSX on purpose: eslint's react-hooks rule
 * (correctly) flags constructing JSX inside a try/catch, since React doesn't
 * render synchronously and the catch would never see a render error anyway.
 * Keeping the try/catch in a plain async function and branching on its
 * result afterwards gets the same fail-visible behaviour without that trap.
 */
async function loadInventory(
  start: string | undefined,
  end: string | undefined,
): Promise<{ ok: true; payload: InventoryPayload } | { ok: false }> {
  try {
    const payload = await getInventory(start, end);
    return { ok: true, payload };
  } catch (err) {
    // adminFetch redirects to /login by THROWING a Next.js control-flow
    // error when the session cookie is missing/expired (see
    // lib/medusa-admin.ts, mirrored by the same rule in
    // lib/actions/inventory.ts's `run()`). That must propagate — swallowing
    // it here would tell an operator "backend unreachable" when their
    // session just died.
    unstable_rethrow(err);
    return { ok: false };
  }
}

/**
 * The date range is a real query scope, not decoration: `getInventory`'s
 * `ordered_in_range` column is computed server-side for whatever start/end
 * this page asks for, so the URL is the single source of truth for "what
 * window is this page showing" — both the fetch AND the "Ordered in
 * range"/"Ordered (all time)" label below derive from it, and neither can
 * drift from the other.
 *
 * URL shapes:
 *   /inventory                          → never seen after the redirect below;
 *                                          means "first visit, no scope chosen yet"
 *   /inventory?range=all                → explicit clear — genuinely all-time
 *   /inventory?start=..&end=..&range=Nd → a preset chip
 *   /inventory?start=..&end=..          → a hand-edited custom window
 */
export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rawRange = str(sp.range);
  const rawStart = str(sp.start);
  const rawEnd = str(sp.end);

  const hasAnyParam = Boolean(rawRange || rawStart || rawEnd);
  if (!hasAnyParam) {
    // Default Last 30d, matching the active chip in the Figma frame — redirect
    // to the canonical URL BEFORE fetching so the very first render's data and
    // its label are scoped to the same window instead of racing each other.
    redirect(`/inventory?${defaultRangeParams().toString()}`);
  }

  const isAllTime = rawRange === "all";
  const start = isAllTime ? undefined : rawStart;
  const end = isAllTime ? undefined : rawEnd;
  const rangeActive = !isAllTime && Boolean(start || end);
  const presetKey = isPresetKey(rawRange) ? rawRange : null;

  const result = await loadInventory(start, end);

  if (!result.ok) {
    // An inventory screen that renders zeros on failure would read as "no
    // stock" — the most dangerous possible lie here. Fail visibly instead.
    return (
      <div className="rounded-panel border border-line bg-surface p-8 text-center">
        <p className="text-base font-semibold text-brand">
          Inventory is unavailable
        </p>
        <p className="mt-1 text-sm text-muted">
          Could not reach the commerce backend. Stock figures are deliberately
          not shown rather than guessed. Reload once the backend is reachable.
        </p>
      </div>
    );
  }

  return (
    <InventoryScreen
      payload={result.payload}
      initialRange={{
        start: start ?? "",
        end: end ?? "",
        range: (presetKey ?? null) as RangeKey,
        active: rangeActive,
      }}
    />
  );
}
