/**
 * Shared "in alert" rust colour (#964022) — used by both the table's bell
 * icon/label (inventory-table.tsx) and the reserve dialog's over-commit
 * warning (stock-dialogs.tsx), so there's a single definition to change.
 *
 * Kept as the FULL Tailwind class string, not just the hex value: Tailwind's
 * JIT scanner finds arbitrary-value utilities by looking for the literal
 * class-name text in source files. Building the string at runtime from a
 * bare hex constant (e.g. `` `text-[${ALERT_HEX}]` ``) would never appear as
 * that literal text anywhere, and the scanner would drop the rule.
 */
export const ALERT_TEXT_CLASS = "text-[#964022]";

/**
 * Bell colour for a variant that HAS a threshold but is not currently below it
 * — Figma #FE9A00 (hex supplied by the client from the live file; the alert
 * cell isn't in `design-reference/admin/specs-inventory.txt`, whose dump stops
 * at `FRAME [Table Row] 1198x61`).
 *
 * Only the bell takes it. The "at N" label beside it stays muted, as drawn —
 * the icon carries "alerting is armed here", the figure is just data. The
 * firing state is a different colour entirely (ALERT_TEXT_CLASS above, rust),
 * and it colours BOTH the bell and the label, which is what separates "armed"
 * from "tripped" at a glance.
 *
 * Same full-class-string rule as above: Tailwind's scanner needs the literal
 * text, so never rebuild this from a bare hex at runtime.
 */
export const ALERT_ARMED_TEXT_CLASS = "text-[#FE9A00]";
