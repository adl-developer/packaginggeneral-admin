import { describe, expect, it } from "vitest";
import { validateProductImageFiles } from "../product-media";

describe("validateProductImageFiles", () => {
  it("accepts up to eight small JPEG, PNG, WebP, or AVIF images", () => {
    expect(
      validateProductImageFiles([
        { name: "front.jpg", type: "image/jpeg", size: 1_000 },
        { name: "side.webp", type: "image/webp", size: 2_000 },
      ]),
    ).toEqual([]);
  });

  it("rejects a file whose type cannot be safely rendered as product media", () => {
    expect(
      validateProductImageFiles([
        { name: "artwork.svg", type: "image/svg+xml", size: 1_000 },
      ]),
    ).toEqual(["artwork.svg must be a JPEG, PNG, WebP, or AVIF image."]);
  });
});
