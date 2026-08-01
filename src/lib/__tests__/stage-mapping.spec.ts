import { describe, expect, it } from "vitest";
import { stageToStatus, statusToStage } from "@/lib/stage-mapping";

describe("stageToStatus", () => {
  it("maps every backend stage to a portal status", () => {
    expect(stageToStatus("new")).toBe("new");
    expect(stageToStatus("in_progress")).toBe("in-progress");
    expect(stageToStatus("ready_for_delivery")).toBe("ready");
    expect(stageToStatus("delivered")).toBe("delivered");
    expect(stageToStatus("cancelled")).toBe("cancelled");
  });

  it("falls back to new for an unrecognised stage", () => {
    expect(stageToStatus("nonsense")).toBe("new");
  });
});

describe("statusToStage", () => {
  it("round-trips every status", () => {
    for (const s of [
      "new",
      "in-progress",
      "ready",
      "delivered",
      "cancelled",
    ] as const) {
      expect(stageToStatus(statusToStage(s))).toBe(s);
    }
  });
});
