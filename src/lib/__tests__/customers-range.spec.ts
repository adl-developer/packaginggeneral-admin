import { describe, expect, it } from "vitest";
import { customersHref, isRangeKey } from "@/lib/customers-range";

describe("isRangeKey", () => {
  it("accepts the four preset keys", () => {
    for (const key of ["7d", "30d", "60d", "90d"]) {
      expect(isRangeKey(key)).toBe(true);
    }
  });

  it("rejects anything else, including inherited Object properties", () => {
    for (const key of ["", "1d", "30", "last30d", "toString", "constructor"]) {
      expect(isRangeKey(key)).toBe(false);
    }
  });
});

describe("customersHref", () => {
  it("omits every param for an empty window — 'clear' is a bare path", () => {
    expect(customersHref({})).toBe("/customers");
    expect(customersHref({ start: "", end: "", range: null })).toBe(
      "/customers",
    );
  });

  it("carries a full window plus its preset key", () => {
    expect(
      customersHref({ start: "2026-07-04", end: "2026-08-02", range: "30d" }),
    ).toBe("/customers?start=2026-07-04&end=2026-08-02&range=30d");
  });

  it("keeps a half-open window (one date typed, the other blank)", () => {
    expect(customersHref({ start: "2026-07-04" })).toBe(
      "/customers?start=2026-07-04",
    );
    expect(customersHref({ end: "2026-08-02" })).toBe(
      "/customers?end=2026-08-02",
    );
  });

  it("drops a preset key with no window — a highlighted chip must never claim a filter that isn't in effect", () => {
    expect(customersHref({ range: "7d" })).toBe("/customers");
  });
});
