import { describe, expect, it } from "vitest";
import {
  ORDERS_PAGE_SIZE,
  clampPage,
  offsetForPage,
  ordersHref,
  pageCount,
  parsePageParam,
  showingLabel,
  showingRange,
} from "@/lib/pagination";

describe("pageCount", () => {
  it("is 1 for an empty result, not 0", () => {
    expect(pageCount(0, 20)).toBe(1);
  });

  it("rounds a partial last page up", () => {
    expect(pageCount(1, 20)).toBe(1);
    expect(pageCount(21, 20)).toBe(2);
    expect(pageCount(45, 20)).toBe(3);
  });

  it("does not add a phantom page when the total is an exact multiple", () => {
    expect(pageCount(20, 20)).toBe(1);
    expect(pageCount(40, 20)).toBe(2);
    expect(pageCount(100, 20)).toBe(5);
  });
});

describe("parsePageParam", () => {
  it("defaults to page 1 when absent", () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam("")).toBe(1);
  });

  it("reads a real page number", () => {
    expect(parsePageParam("3")).toBe(3);
    expect(parsePageParam(" 7 ")).toBe(7);
  });

  it("falls back to 1 rather than producing a negative offset", () => {
    for (const bad of ["0", "-2", "1.5", "abc", "NaN"]) {
      expect(parsePageParam(bad)).toBe(1);
    }
  });
});

describe("offsetForPage", () => {
  it("maps page 1 to offset 0", () => {
    expect(offsetForPage(1, 20)).toBe(0);
  });

  it("steps by the page size", () => {
    expect(offsetForPage(2, 20)).toBe(20);
    expect(offsetForPage(5, 20)).toBe(80);
  });

  it("never goes negative", () => {
    expect(offsetForPage(0, 20)).toBe(0);
    expect(offsetForPage(-4, 20)).toBe(0);
  });

  it("round-trips with parsePageParam", () => {
    expect(offsetForPage(parsePageParam("4"), ORDERS_PAGE_SIZE)).toBe(60);
  });
});

describe("clampPage", () => {
  it("leaves an in-range page alone", () => {
    expect(clampPage(2, 45, 20)).toBe(2);
  });

  it("pulls page 5 of a 2-page filter back to the last page", () => {
    expect(clampPage(5, 30, 20)).toBe(2);
  });

  it("pulls anything back to 1 when nothing matches", () => {
    expect(clampPage(5, 0, 20)).toBe(1);
  });

  it("keeps the last page of an exact multiple reachable", () => {
    expect(clampPage(2, 40, 20)).toBe(2);
    expect(clampPage(3, 40, 20)).toBe(2);
  });
});

describe("showingRange", () => {
  it("describes a full first page", () => {
    expect(showingRange(45, 0, 20)).toEqual({ from: 1, to: 20, total: 45 });
  });

  it("describes a short last page from what was actually returned", () => {
    expect(showingRange(45, 40, 5)).toEqual({ from: 41, to: 45, total: 45 });
  });

  it("describes the exact-multiple last page", () => {
    expect(showingRange(40, 20, 20)).toEqual({ from: 21, to: 40, total: 40 });
  });

  it("collapses to zeroes for an empty page", () => {
    expect(showingRange(0, 0, 0)).toEqual({ from: 0, to: 0, total: 0 });
    expect(showingRange(45, 200, 0)).toEqual({ from: 0, to: 0, total: 45 });
  });
});

describe("showingLabel", () => {
  it("names the range and the whole filtered total", () => {
    expect(showingLabel({ from: 1, to: 20, total: 45 })).toBe(
      "Showing 1–20 of 45",
    );
  });

  it("says so plainly when nothing matched", () => {
    expect(showingLabel({ from: 0, to: 0, total: 0 })).toBe("No orders");
  });

  it("does not claim a range when the page overshot a non-empty result", () => {
    expect(showingLabel({ from: 0, to: 0, total: 45 })).toBe("0 of 45 orders");
  });
});

describe("ordersHref", () => {
  it("is bare /orders with no filters on page 1", () => {
    expect(ordersHref({})).toBe("/orders");
    expect(ordersHref({ page: 1 })).toBe("/orders");
  });

  it("omits empty filter values", () => {
    expect(ordersHref({ stage: "", worker: "", q: "" })).toBe("/orders");
  });

  it("carries filters and the page together", () => {
    expect(ordersHref({ stage: "new", worker: "unassigned", page: 3 })).toBe(
      "/orders?stage=new&worker=unassigned&page=3",
    );
  });

  it("encodes a search term", () => {
    expect(ordersHref({ q: "PG-2026-002 & box" })).toBe(
      "/orders?q=PG-2026-002+%26+box",
    );
  });

  it("drops ?page= when returning to the first page", () => {
    expect(ordersHref({ stage: "delivered", page: 1 })).toBe(
      "/orders?stage=delivered",
    );
  });
});
