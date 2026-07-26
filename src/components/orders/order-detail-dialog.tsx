"use client";

import * as React from "react";
import { MapPin, MessageSquarePlus, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Select, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NEXT_STAGE, ORDER_STATUS_LABEL } from "@/lib/data/types";
import type { Order, TeamMember } from "@/lib/data/types";
import { formatCedis, formatDate } from "@/lib/utils";

/**
 * View Order Detail — Figma 3835:17437 (462px dialog).
 * Two tabs: Details (order info, assignment, customization, delivery, actions)
 * and Activity History (per-order audit timeline).
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
  order: Order;
  team: TeamMember[];
  open: boolean;
  onClose: () => void;
  onAssign: (memberId: string) => void;
  onAdvance: () => void;
  onAddNote: (note: string) => void;
  onRequestCancel: () => void;
}) {
  const [note, setNote] = React.useState("");
  const assignee = team.find((m) => m.id === order.assignedTo);
  const next = NEXT_STAGE[order.status];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Order ${order.number}`}
      width={462}
    >
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
          <dl className="flex flex-col gap-3">
            <Row label="Order Number" value={order.number} />
            <Row
              label="Status"
              value={<StatusBadge status={order.status} />}
            />
            <Row label="Product" value={order.product} />
            <Row
              label="Quantity"
              value={`${order.quantity.toLocaleString()} units`}
            />
            <Row label="Total Amount" value={formatCedis(order.total)} />
            <Row label="Order Date" value={formatDate(order.placedAt)} />
          </dl>

          <Section title="Assignment">
            {assignee ? (
              <p className="text-sm leading-5 text-brand">
                {assignee.name}
                {order.assignedAt && (
                  <span className="text-muted">
                    {" "}
                    · claimed {formatDate(order.assignedAt)}
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
          </Section>

          <Section title="Customization Details">
            <dl className="flex flex-col gap-2">
              <KeyVal k="Size:" v={order.customization.size} />
              <KeyVal k="Material:" v={order.customization.material} />
              <KeyVal k="Printing:" v={order.customization.printing} />
            </dl>
          </Section>

          <Section title="Delivery Information">
            <p className="flex items-center gap-2 text-sm leading-5 text-brand">
              <MapPin className="size-4 shrink-0 text-muted" aria-hidden />
              {order.delivery}
            </p>
          </Section>

          {order.notes.length > 0 && (
            <Section title="Notes">
              <ul className="flex flex-col gap-2">
                {order.notes.map((n, i) => (
                  <li key={i} className="text-sm leading-5 text-brand">
                    {n}
                  </li>
                ))}
              </ul>
            </Section>
          )}

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
            {order.status !== "cancelled" && order.status !== "delivered" && (
              <Button variant="plumOutline" onClick={onRequestCancel}>
                <XCircle className="size-4" aria-hidden />
                Cancel Order
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <ol className="flex flex-col">
            {order.activity.map((entry, i) => (
              <li
                key={entry.id}
                className={
                  i === order.activity.length - 1
                    ? "flex flex-col gap-0.5 py-3"
                    : "flex flex-col gap-0.5 border-b border-line py-3"
                }
              >
                <p className="text-sm leading-5 text-brand">
                  <span className="font-medium">{entry.actor}</span>{" "}
                  {entry.action}
                </p>
                <p className="text-xs leading-4 text-muted">
                  {formatDate(entry.at)}
                </p>
              </li>
            ))}
          </ol>
        </TabsContent>
      </Tabs>
    </Dialog>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm leading-5 text-muted">{label}</dt>
      <dd className="text-sm leading-5 font-medium text-brand">{value}</dd>
    </div>
  );
}

function KeyVal({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm leading-5 text-muted">{k}</dt>
      <dd className="text-sm leading-5 text-brand">{v}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 border-t border-line pt-4">
      <h3 className="pb-2 text-sm font-medium leading-5 text-brand">{title}</h3>
      {children}
    </section>
  );
}
