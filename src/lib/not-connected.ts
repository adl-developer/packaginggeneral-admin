/**
 * The one sentence every not-yet-wired control says.
 *
 * Screens still on fixtures (Promotions) or still awaiting a backend seam
 * (Settings → Platform, the ProductCreator) must say so in visible copy AND
 * genuinely `disabled` their submit controls. A control that looks functional
 * but changes nothing is a defect in this codebase, not a placeholder.
 *
 * Single constant rather than a copy per screen so the wording can never drift
 * between them — and so removing it when a screen IS wired is one obvious edit
 * per call site.
 */
export const NOT_CONNECTED_MESSAGE = "Not yet connected — changes are not saved.";
