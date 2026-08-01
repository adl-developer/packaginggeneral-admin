"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { PromotionDialog } from "@/components/promotions/promotion-dialog";
import { PROMO_BANNER, PROMO_CODES } from "@/lib/data/mock";
import type { PromoBanner, PromoCode, PromoStatus } from "@/lib/data/types";
import { cn, formatCedis, formatDate } from "@/lib/utils";

type Filter = "all" | PromoStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "archived", label: "Archived" },
];

/**
 * Promotions — Figma 3814:7183 (banner editor + promo codes).
 *
 * Spec 2 (not yet built): the discount fields this screen would need don't
 * exist in the current design. This screen stays on the fixtures in
 * `lib/data/mock.ts`, held as local component state (session-only — nothing
 * here is persisted) now that the shared `AdminProvider` is gone (Task 17).
 */
export default function PromotionsPage() {
  const [banner, setBanner] = React.useState<PromoBanner>(PROMO_BANNER);
  const saveBanner = setBanner;

  const [promoCodes, setPromoCodes] = React.useState<PromoCode[]>(PROMO_CODES);
  const upsertPromoCode = (code: PromoCode) =>
    setPromoCodes((prev) => {
      const exists = prev.some((c) => c.id === code.id);
      return exists
        ? prev.map((c) => (c.id === code.id ? code : c))
        : [code, ...prev];
    });

  const [live, setLive] = React.useState(banner.live);
  const [message, setMessage] = React.useState(banner.message);
  const [saved, setSaved] = React.useState(false);

  const [filter, setFilter] = React.useState<Filter>("all");
  const [editing, setEditing] = React.useState<PromoCode | null>(null);
  const [creating, setCreating] = React.useState(false);

  const dirty = live !== banner.live || message !== banner.message;
  const visible = promoCodes.filter((c) =>
    filter === "all" ? true : c.status === filter,
  );
  const activeCount = promoCodes.filter((c) => c.status === "active").length;

  const [headline, ...rest] = message.split("\n");

  return (
    <>
      {/* Promotional banner */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-medium leading-6 text-brand">
                Promotional Banner
              </h2>
              <p className="text-sm leading-5 text-muted">
                Set the announcement text shown at the top of the storefront
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium leading-5 text-brand">
                Live
              </span>
              <Switch
                checked={live}
                onChange={(v) => {
                  setLive(v);
                  setSaved(false);
                }}
                label="Banner live"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="banner-message">Banner message</Label>
            <Textarea
              id="banner-message"
              rows={3}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setSaved(false);
              }}
              placeholder="e.g. Enjoy 10% off for all Easter orders Code: PGEASTER"
            />
            <p className="text-xs leading-4 text-muted">
              Use a new line to separate the main message from the sub-message.
            </p>
          </div>

          <div className="mt-5">
            <p className="pb-2 text-sm font-medium leading-[14px] text-brand">
              Preview
            </p>
            <div
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-button px-4 py-2 text-center",
                live ? "bg-accent" : "bg-line",
              )}
            >
              <p className="text-sm font-medium leading-5 text-brand-foreground">
                {headline || "Your banner message"}
              </p>
              {rest.length > 0 && rest.join(" ").trim() && (
                <p className="text-xs leading-4 text-brand-foreground/80">
                  {rest.join(" ")}
                </p>
              )}
            </div>
            {!live && (
              <p className="pt-2 text-xs leading-4 text-muted">
                The banner is paused and will not appear on the storefront.
              </p>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button
              disabled={!dirty}
              onClick={() => {
                saveBanner({ live, message });
                setSaved(true);
              }}
            >
              Save Banner
            </Button>
            {saved && !dirty && (
              <span className="text-sm leading-5 text-muted">Saved</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Promo codes */}
      <Card className="mt-6">
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold leading-7 text-brand">
                Promo Codes
              </h2>
              <p className="text-sm leading-5 text-muted">
                {activeCount} active codes
              </p>
            </div>
            <Button onClick={() => setCreating(true)}>Create Code</Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/*
            Figma: these are separate bordered chips, NOT a segmented track —
            active = brand fill + #fefdfb label; inactive = #e8e5de with a
            #c4bcb0 border and muted label.
          */}
          <div className="mb-4 flex items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-button border px-3",
                  "text-xs font-medium leading-4 transition-colors",
                  filter === f.key
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-line bg-background text-muted hover:text-brand",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="border-t border-line py-12 text-center text-sm text-muted">
              No promo codes in this view
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Code</TH>
                  <TH>Name</TH>
                  <TH>Date Added</TH>
                  <TH>Usage</TH>
                  <TH>Expiration</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {visible.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-medium whitespace-nowrap">{c.code}</TD>
                    <TD>
                      <span className="block text-sm leading-5 text-brand">
                        {c.name}
                      </span>
                      <span className="block text-xs leading-4 text-muted">
                        {c.description}
                      </span>
                    </TD>
                    <TD className="whitespace-nowrap text-muted">
                      {formatDate(c.addedAt)}
                    </TD>
                    {/* Spend budgets are money, usage budgets are counts. */}
                    <TD className="tabular-nums whitespace-nowrap">
                      {c.budgetType === "spend"
                        ? `${formatCedis(c.used)} / ${formatCedis(c.limit)}`
                        : `${c.used.toLocaleString()} / ${c.limit.toLocaleString()}`}
                    </TD>
                    <TD className="whitespace-nowrap text-muted">
                      {formatDate(c.expiresAt)}
                    </TD>
                    <TD>
                      <Badge
                        tone="solid"
                        className={
                          c.status === "archived"
                            ? "bg-muted text-brand-foreground"
                            : undefined
                        }
                      >
                        {c.status}
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(c)}
                      >
                        Edit
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {(editing || creating) && (
        <PromotionDialog
          promo={editing}
          open
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(promo) => {
            upsertPromoCode(promo);
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </>
  );
}
