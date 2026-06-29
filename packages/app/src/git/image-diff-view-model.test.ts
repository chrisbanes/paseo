import { describe, expect, it } from "vitest";
import { canCompareImages, isAddedImage } from "./image-diff-view-model";

describe("image diff view model", () => {
  it("identifies added images", () => {
    expect(
      isAddedImage({
        cwd: "/repo",
        path: "new.png",
        oldImage: { status: "missing" },
        newImage: availableImage(),
        diffImage: { status: "missing" },
        error: null,
        requestId: "req",
      }),
    ).toBe(true);
  });

  it("enables comparison only when both sides are available", () => {
    expect(
      canCompareImages({
        cwd: "/repo",
        path: "changed.png",
        oldImage: availableImage(),
        newImage: availableImage(),
        diffImage: { status: "missing" },
        error: null,
        requestId: "req",
      }),
    ).toBe(true);

    expect(
      canCompareImages({
        cwd: "/repo",
        path: "new.png",
        oldImage: { status: "missing" },
        newImage: availableImage(),
        diffImage: { status: "missing" },
        error: null,
        requestId: "req",
      }),
    ).toBe(false);
  });
});

function availableImage() {
  return {
    status: "available" as const,
    mimeType: "image/png",
    encoding: "base64" as const,
    content: "aGVsbG8=",
    size: 5,
    width: 1,
    height: 1,
  };
}
