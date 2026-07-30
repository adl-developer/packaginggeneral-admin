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
