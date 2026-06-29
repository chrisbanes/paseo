import { describe, expect, test } from "vitest";
import { shouldRenderImageDiffBody } from "./image-diff-helpers";
import type { ParsedDiffFile } from "./use-diff-query";

const baseFile: ParsedDiffFile = {
  path: "test.png",
  status: "binary",
  additions: 0,
  deletions: 0,
  isNew: false,
  isDeleted: false,
  hunks: [],
};

describe("shouldRenderImageDiffBody", () => {
  test("returns true for image binary files", () => {
    expect(
      shouldRenderImageDiffBody({
        ...baseFile,
        binaryKind: "image",
        mimeType: "image/png",
      }),
    ).toBe(true);
  });

  test("returns false for non-image binary files", () => {
    expect(shouldRenderImageDiffBody(baseFile)).toBe(false);
  });

  test("returns false for non-binary image metadata", () => {
    expect(
      shouldRenderImageDiffBody({
        ...baseFile,
        status: "ok",
        binaryKind: "image",
        mimeType: "image/png",
      }),
    ).toBe(false);
  });
});
