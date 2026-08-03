"use server";

import type { Levies } from "@/lib/data/platform";
// ⚠ Do NOT re-export a type from a "use server" file — see the note in
// ./orders.ts. It becomes a runtime export and the module throws
// ReferenceError at request time, with all four local checks still green.
import { run, type ActionResult } from "./run";

/**
 * Save the Ghana levy split.
 *
 * ⚠ This CHANGES WHAT CUSTOMERS ARE CHARGED. The backend writes the sum of the
 * three levies as the tax region's single rate, and stores the split beside it
 * so invoices itemise exactly that. There is no separate "rate" field to get
 * out of step with — that is the point.
 *
 * Refused for anyone below `admin` (403) and for a split that doesn't validate
 * (400, with the failing field's own message).
 */
export async function saveLevies(levies: Levies): Promise<ActionResult> {
  return run("/admin/pg/settings/platform", "POST", "/settings", levies);
}
