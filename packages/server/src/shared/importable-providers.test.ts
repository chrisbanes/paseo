import { expect, test } from "vitest";

import { IMPORTABLE_PROVIDERS } from "./importable-providers.js";

test("IMPORTABLE_PROVIDERS includes cursor for ACP session import", () => {
  expect(IMPORTABLE_PROVIDERS).toContain("cursor");
});

test("IMPORTABLE_PROVIDERS keeps the existing first-party import providers", () => {
  expect(IMPORTABLE_PROVIDERS).toEqual(
    expect.arrayContaining(["claude", "codex", "opencode", "pi"]),
  );
});

test("IMPORTABLE_PROVIDERS excludes generic ACP catalog providers", () => {
  expect(IMPORTABLE_PROVIDERS).not.toContain("gemini");
  expect(IMPORTABLE_PROVIDERS).not.toContain("copilot");
});
