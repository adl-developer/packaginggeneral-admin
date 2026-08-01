import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Boxes, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/orders/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboard, type DashboardPayload } from "@/lib/data/dashboard";
import { stageToStatus } from "@/lib/stage-mapping";
import { cn, formatCedis } from "@/lib/utils";

/** Live Medusa data — never cache. */
export const dynamic = "force-dynamic";

/**
 * Isolated from the returned JSX on purpose, same reasoning as
 * `inventory/page.tsx`'s `loadInventory`: eslint's react-hooks rule
 * (correctly) flags constructing JSX inside a try/catch, since React doesn't
 * render synchronously and the catch would never see a render error anyway.
 */
async function loadDashboard(): Promise<
  { ok: true; payload: DashboardPayload } | { ok: false }
> {
  try {
    const payload = await getDashboard();
    return { ok: true, payload };
  } catch (err) {
    // adminFetch redirects to /login by THROWING a Next.js control-flow
    // error when the session cookie is missing/expired (see
    // lib/medusa-admin.ts, mirrored by the same rule in
    // inventory/page.tsx and orders/page.tsx). That must propagate —
    // swallowing it here would tell an operator "backend unreachable" when
    // their session just died.
    unstable_rethrow(err);
    // Unlike Inventory/Orders, `GET /admin/pg/dashboard` takes no query
    // params, so there is no "operator's own bad URL" case to distinguish —
    // anything else here is a real unreachable backend.
    return { ok: false };
  }
}

/**
 * Overview — Figma 3814:5507, wired to `GET /admin/pg/dashboard`.
 *
 * The route has no date-range query params (unlike Inventory/Orders), so
 * there is no filter bar here — the stat cards and recent-orders list always
 * describe the current live state of the store.
 */
export default async function OverviewPage() {
  const result = await loadDashboard();

  if (!result.ok) {
    // Never render zeros on failure — a revenue card reading GH₵0.00 during
    // an outage is exactly the dangerous lie this portal must avoid. Fail
    // visibly instead.
    return (
      <div className="rounded-panel border border-line bg-surface p-8 text-center">
        <p className="text-base font-semibold text-brand">
          Overview is unavailable
        </p>
        <p className="mt-1 text-sm text-muted">
          Could not reach the commerce backend. Order and revenue figures are
          deliberately not shown rather than guessed. Reload once the
          backend is reachable.
        </p>
      </div>
    );
  }

  const { stats, recent_orders: recentOrders } = result.payload;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Orders"
          value={String(stats.total_orders)}
          footer={
            <FooterNote icon={<TrendingUp className="size-4" aria-hidden />}>
              {stats.new_orders} new
            </FooterNote>
          }
        />
        <StatCard
          label="In Progress"
          value={String(stats.in_progress)}
          footer={<Badge>Active orders</Badge>}
        />
        <StatCard
          label="Active Products"
          value={String(stats.active_products)}
          footer={
            <FooterNote icon={<Boxes className="size-4" aria-hidden />}>
              {stats.product_categories} categories
            </FooterNote>
          }
        />
        <StatCard
          label="Total Revenue"
          value={formatCedis(stats.total_revenue)}
          valueClassName="text-2xl leading-8"
          footer={
            /* Figma: this one footer is GREEN (#00a63e) — icon and label. */
            <FooterNote
              className="text-[#00a63e]"
              icon={<TrendingUp className="size-4" aria-hidden />}
            >
              Growing
            </FooterNote>
          }
          note={
            // Surfacing `sampled` matters: silently truncating the order scan
            // behind this card would read as "this is the total" when it is
            // not (see `dashboard.ts`'s DashboardStats.sampled comment).
            stats.sampled ? (
              <p className="mt-2 text-xs text-muted">
                Based on the most recent 1,000 orders.
              </p>
            ) : null
          }
        />
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders in the system</CardDescription>
            </div>
            <Link href="/orders" className={buttonVariants({ variant: "outline" })}>
              View All
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {recentOrders.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              No orders yet.
            </p>
          ) : (
            <ul>
              {recentOrders.map((order, i) => (
                <li
                  key={order.id}
                  className={
                    i === recentOrders.length - 1
                      ? "flex items-start justify-between gap-4 py-4"
                      : "flex items-start justify-between gap-4 border-b border-line py-4 first:pt-0"
                  }
                >
                  <div className="min-w-0">
                    <p className="truncate text-base leading-6 text-brand">
                      {order.first_item_title ?? "Order"}
                    </p>
                    <p className="text-sm leading-5 text-muted">
                      {order.order_number} •{" "}
                      {order.total_quantity.toLocaleString()} units
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-base leading-6 text-brand">
                      {formatCedis(order.total)}
                    </p>
                    <StatusBadge status={stageToStatus(order.stage)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function StatCard({
  label,
  value,
  valueClassName,
  footer,
  note,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  footer: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        {/* Figma: 30px/500/lh36 — the revenue card drops to 24px/500/lh32. */}
        <p
          className={cn(
            "font-medium text-brand",
            valueClassName ?? "text-3xl leading-9",
          )}
        >
          {value}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {footer}
        {note}
      </CardContent>
    </Card>
  );
}

function FooterNote({
  icon,
  className,
  children,
}: {
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  // Figma: 16px icon stroked #7a7575 (muted), 8px gap, label 14px/400 muted.
  // The Total Revenue card overrides both to green via `className`.
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm leading-5 text-muted",
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
