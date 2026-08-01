"use client";

import Link from "next/link";
import { Boxes, TrendingUp } from "lucide-react";
import { DateFilterBar } from "@/components/layout/date-filter-bar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { statusCounts, summarize } from "@/lib/data";
import { ORDERS, TOTAL_ORDERS_ALL_TIME } from "@/lib/data/mock";
import { useDateFilter } from "@/lib/use-date-filter";
import { cn, formatCedis } from "@/lib/utils";

/**
 * Overview — Figma 3814:5507.
 * Four 288×172 stat cards on a 16px gap, then the 1200×498 Recent Orders card.
 *
 * ⚠ STILL MOCK DATA (`ORDERS`), not the store. Task 9 removed the orders
 * slice from `lib/store.tsx` (orders now live in `lib/actions/orders.ts` +
 * `orders/page.tsx`'s server fetch) — this screen isn't in that task's scope,
 * so it was pointed straight at the same fixture it already showed rather
 * than left broken. Task 13 ("Admin Overview wired") replaces this with a
 * live fetch; don't build further mock features on top of it meanwhile.
 */
export default function OverviewPage() {
  const orders = ORDERS;
  const {
    start,
    end,
    range,
    filtered,
    applyPreset,
    clearRange,
    editStart,
    editEnd,
  } = useDateFilter(orders);

  const stats = summarize(filtered);
  const counts = statusCounts(filtered);
  const recent = [...filtered]
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
    .slice(0, 5);

  return (
    <>
      <DateFilterBar
        start={start}
        end={end}
        range={range}
        onStart={editStart}
        onEnd={editEnd}
        onPreset={applyPreset}
        onClear={clearRange}
        showing={filtered.length}
        total={TOTAL_ORDERS_ALL_TIME}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Orders"
          value={String(stats.totalOrders)}
          footer={
            <FooterNote icon={<TrendingUp className="size-4" aria-hidden />}>
              {counts.new} new
            </FooterNote>
          }
        />
        <StatCard
          label="In Progress"
          value={String(stats.inProgress)}
          footer={<Badge>Active orders</Badge>}
        />
        <StatCard
          label="Active Products"
          value={String(stats.activeProducts)}
          footer={
            <FooterNote icon={<Boxes className="size-4" aria-hidden />}>
              {stats.categories} categories
            </FooterNote>
          }
        />
        <StatCard
          label="Total Revenue"
          value={formatCedis(stats.revenue)}
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
          {recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              No orders in this period.
            </p>
          ) : (
            <ul>
              {recent.map((order, i) => (
                <li
                  key={order.id}
                  className={
                    i === recent.length - 1
                      ? "flex items-start justify-between gap-4 py-4"
                      : "flex items-start justify-between gap-4 border-b border-line py-4 first:pt-0"
                  }
                >
                  <div className="min-w-0">
                    <p className="truncate text-base leading-6 text-brand">
                      {order.product}
                    </p>
                    <p className="text-sm leading-5 text-muted">
                      {order.number} • {order.quantity.toLocaleString()} units
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-base leading-6 text-brand">
                      {formatCedis(order.total)}
                    </p>
                    <Badge>{order.status}</Badge>
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
}: {
  label: string;
  value: string;
  valueClassName?: string;
  footer: React.ReactNode;
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
      <CardContent className="pt-0">{footer}</CardContent>
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
