import { Badge } from "@/components/ui/badge";

/**
 * Registered vs Guest, colour-coded — the Customers table's Account column and
 * the customer-detail dialog both render through here so the two can't drift.
 *
 * ⚠ DELIBERATE DIVERGENCE from the admin badge rule in `ui/badge.tsx` ("every
 * badge in the admin design is OUTLINE — state is conveyed by the label, never
 * by fill colour"), requested by the user 2026-08-02 for this badge
 * specifically. It is a scoped exception, not a licence to colour the order
 * status badges: leave `StatusBadge` alone.
 *
 * Colours come from the existing palette (`app/globals.css`) — no new tokens,
 * because that file must stay in sync with the storefront's. Lavender
 * `--color-accent` (#b8a8d9) for registered against warm sand
 * `--color-line` (#c4bcb0) for guest: two clearly different hues rather than
 * two shades of the same brown. Deliberately NOT plum or rust — those already
 * mean "cancel" and "View action" elsewhere in the portal.
 *
 * The label still says which is which, so the colour is reinforcement, not the
 * only carrier of the meaning (colour-blind operators, greyscale printouts).
 *
 * ⚠ Borders use arbitrary rgba values, not `border-accent/70` — the Tailwind
 * v4 border-token-with-opacity bug documented in `admin/CLAUDE.md`.
 */
export function AccountBadge({ hasAccount }: { hasAccount: boolean }) {
  return (
    <Badge
      className={
        hasAccount
          ? "border border-[rgba(184,168,217,0.9)] bg-[rgba(184,168,217,0.3)] text-brand"
          : "border border-[rgba(196,188,176,1)] bg-[rgba(196,188,176,0.45)] text-muted"
      }
    >
      {hasAccount ? "Registered" : "Guest"}
    </Badge>
  );
}
