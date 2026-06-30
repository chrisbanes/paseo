/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useImageDiffQuery } from "./use-image-diff-query";

const mocks = vi.hoisted(() => ({
  checkoutGetImageDiff: vi.fn(),
}));

vi.mock("@/runtime/host-runtime", () => ({
  useHostRuntimeClient: () => ({ checkoutGetImageDiff: mocks.checkoutGetImageDiff }),
  useHostRuntimeIsConnected: () => true,
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useImageDiffQuery", () => {
  beforeEach(() => {
    mocks.checkoutGetImageDiff.mockReset();
  });

  it("loads image diff when enabled", async () => {
    mocks.checkoutGetImageDiff.mockResolvedValueOnce({
      cwd: "/repo",
      path: "after.png",
      oldImage: { status: "missing" },
      newImage: {
        status: "available",
        mimeType: "image/png",
        encoding: "base64",
        content: "aGVsbG8=",
        size: 5,
        width: 1,
        height: 1,
      },
      diffImage: { status: "missing" },
      error: null,
      requestId: "req-image",
    });

    const { result } = renderHook(
      () =>
        useImageDiffQuery({
          serverId: "server-1",
          cwd: "/repo",
          path: "after.png",
          oldPath: "before.png",
          mode: "uncommitted",
          enabled: true,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data?.path).toBe("after.png"));
    expect(result.current.isStale).toBe(false);
    expect(mocks.checkoutGetImageDiff).toHaveBeenCalledWith(
      "/repo",
      {
        path: "after.png",
        oldPath: "before.png",
        compare: { mode: "uncommitted", ignoreWhitespace: false },
      },
      expect.stringMatching(/^imageDiff:/),
    );
  });

  it("does not load when disabled", () => {
    renderHook(
      () =>
        useImageDiffQuery({
          serverId: "server-1",
          cwd: "/repo",
          path: "baseline.png",
          mode: "uncommitted",
          enabled: false,
        }),
      { wrapper },
    );

    expect(mocks.checkoutGetImageDiff).not.toHaveBeenCalled();
  });
});
