"use client";

import * as React from "react";
import { MessageSquarePlus, XCircle } from "lucide-react";
import {
  ActivityList,
  CustomerDetails,
  DeliveryDetails,
  ItemsTable,
  MetadataDetails,
  NotesList,
  PaymentDetails,
  TotalsDetails,
} from "@/components/orders/order-detail-sections";
import { StatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import { Collapsible } from "@/components/ui/collapsible";
import { Dialog } from "@/components/ui/dialog";
import { Label, Select, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OrderDetail } from "@/lib/data/orders";
import { stageToStatus } from "@/lib/stage-mapping";
import { NEXT_STAGE, ORDER_STATUS_LABEL } from "@/lib/data/types";
import type { TeamMember } from "@/lib/data/types";
import { formatCedis, formatDate } from "@/lib/utils";

/**
 * View Order Detail.
 *
 * ⚠ DELIBERATE DIVERGENCE from Figma 3835:17437 (462px dialog, flat sections),
 * requested by the user 2026-07-31: at 720px with collapsible sections, the
 * added order data (line items, payment, totals, address, metadata) fits
 * without becoming cumbersome. Do not "fix" this back to 462px/flat in a
 * design-parity pass.
 *
 * Customization is rendered PER LINE ITEM (see order-detail-sections.tsx),
 * not once for the whole order — the old 462px dialog had a single
 * Size/Material/Printing block, which is wrong once an order has more than
 * one item.
 *
 * The endpoint this reads from (`GET /admin/pg/orders/:id`) deliberately
 * excludes the payer's mobile-money number, card authorization and IP
 * address. Nothing in this file should reconstruct or display them.
 */
export function OrderDetailDialog({
  order,
  team,
  open,
  onClose,
  onAssign,
  onAdvance,
  onAddNote,
  onRequestCancel,
}: {
  order: OrderDetail;
  team: TeamMember[];
  open: boolean;
  onClose: () => void;
  onAssign: (memberId: string) => void;
  onAdvance: () => void;
  onAddNote: (note: string) => void;
  onRequestCancel: () => void;
}) {
  const [note, setNote] = React.useState("");
  const assignee = team.find((m) => m.id === order.assignment.assigned_to_id);
  // stageToStatus, never inline string replacement — the backend's
  // `ORDER_STAGES` and the portal's `OrderStatus` are spelled differently.
  const status = stageToStatus(order.stage);
  const next = NEXT_STAGE[status];
  const notes = order.activities.filter((a) => a.type === "note");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Order ${order.order_number}`}
      width={720}
    >
      {/* Status badge beside the title — always visible regardless of tab. */}
      <div className="mb-4 flex items-center gap-3">
        <StatusBadge status={status} />
      </div>

      <Tabs defaultValue="details">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="details" className="flex-1">
            Details
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">
            Activity History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          {/* Three-up summary strip: Total · Placed · Items count. */}
          <div className="grid grid-cols-3 gap-4 rounded-card border border-line bg-[rgba(196,188,176,0.15)] p-4">
            <SummaryStat label="Total" value={formatCedis(order.totals.total)} />
            <SummaryStat label="Placed" value={formatDate(order.created_at)} />
            <SummaryStat
              label="Items"
              value={order.items.length.toLocaleString()}
            />
          </div>

          {/* Assignment is a primary action, so it stays always visible
              rather than tucked behind a Collapsible. */}
          <section className="mt-5 border-t border-line pt-4">
            <h3 className="pb-2 text-sm font-medium leading-5 text-brand">
              Assignment
            </h3>
            {assignee ? (
              <p className="text-sm leading-5 text-brand">
                {assignee.name}
                {order.assignment.claimed_at && (
                  <span className="text-muted">
                    {" "}
                    · claimed {formatDate(order.assignment.claimed_at)}
                  </span>
                )}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm leading-5 text-muted">Not assigned yet</p>
                <Select
                  aria-label="Assign worker"
                  defaultValue=""
                  onChange={(e) => e.target.value && onAssign(e.target.value)}
                >
                  <option value="" disabled>
                    Assign worker
                  </option>
                  {team.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </section>

          <Collapsible title="Items" count={order.items.length} defaultOpen>
            <ItemsTable items={order.items} />
          </Collapsible>

          <Collapsible
            title="Payment"
            summary={
              order.payment
                ? `${order.payment.status} · ${formatCedis(order.payment.captured)}`
                : "No payment"
            }
          >
            <PaymentDetails payment={order.payment} />
          </Collapsible>

          <Collapsible
            title="Totals"
            summary={formatCedis(order.totals.total)}
          >
            <TotalsDetails totals={order.totals} />
          </Collapsible>

          <Collapsible
            title="Delivery"
            summary={
              [
                order.shipping_address?.city,
                order.shipping_address?.country_code?.toUpperCase(),
              ]
                .filter(Boolean)
                .join(", ") || "No address"
            }
          >
            <DeliveryDetails
              address={order.shipping_address}
              shippingMethods={order.shipping_methods}
              fulfillments={order.fulfillments}
            />
          </Collapsible>

          <Collapsible
            title="Customer"
            summary={order.customer?.name ?? order.email ?? "—"}
          >
            <CustomerDetails order={order} />
          </Collapsible>

          <Collapsible
            title="Order metadata"
            summary={`${order.currency_code} · ${order.native_status}`}
          >
            <MetadataDetails order={order} />
          </Collapsible>

          <Collapsible title="Notes" count={notes.length}>
            <NotesList notes={notes} />
          </Collapsible>

          <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4">
            <Label htmlFor="order-note">Add Note</Label>
            <Textarea
              id="order-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add an internal note…"
            />
            <Button
              variant="outline"
              disabled={!note.trim()}
              onClick={() => {
                onAddNote(note.trim());
                setNote("");
              }}
            >
              <MessageSquarePlus className="size-4" aria-hidden />
              Add Note
            </Button>

            {next && (
              <Button onClick={onAdvance}>
                Move to {ORDER_STATUS_LABEL[next]}
              </Button>
            )}

            {/* Figma: bg #e8e5de, 1px rgba(155,107,143,0.4), plum label + XCircle. */}
            {status !== "cancelled" && status !== "delivered" && (
              <Button variant="plumOutline" onClick={onRequestCancel}>
                <XCircle className="size-4" aria-hidden />
                Cancel Order
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <ActivityList activities={order.activities} />
        </TabsContent>
      </Tabs>
    </Dialog>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs leading-4 text-muted">{label}</p>
      <p className="truncate text-sm leading-5 font-medium text-brand">
        {value}
      </p>
    </div>
  );
}
