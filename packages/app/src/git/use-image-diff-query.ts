import { useMemo } from "react";
import type { CheckoutDiffGetImageResponse } from "@getpaseo/protocol/messages";
import { useFetchQuery } from "@/data/query";
import { useHostRuntimeClient, useHostRuntimeIsConnected } from "@/runtime/host-runtime";
import { checkoutImageDiffQueryKey } from "@/git/query-keys";

interface UseImageDiffQueryOptions {
  serverId: string;
  cwd: string;
  path: string;
  oldPath?: string;
  mode: "uncommitted" | "base";
  baseRef?: string;
  ignoreWhitespace?: boolean;
  enabled: boolean;
}

interface ImageDiffCompare {
  mode: "uncommitted" | "base";
  baseRef?: string;
  ignoreWhitespace: boolean;
}

export type ImageDiffPayload = CheckoutDiffGetImageResponse["payload"];

export function useImageDiffQuery({
  serverId,
  cwd,
  path,
  oldPath,
  mode,
  baseRef,
  ignoreWhitespace,
  enabled,
}: UseImageDiffQueryOptions) {
  const client = useHostRuntimeClient(serverId);
  const isConnected = useHostRuntimeIsConnected(serverId);
  const compare = useMemo<ImageDiffCompare>(
    () => ({
      mode,
      ...(mode === "base" && baseRef?.trim() ? { baseRef: baseRef.trim() } : {}),
      ignoreWhitespace: ignoreWhitespace === true,
    }),
    [baseRef, ignoreWhitespace, mode],
  );
  const queryKey = checkoutImageDiffQueryKey(
    serverId,
    cwd,
    path,
    oldPath,
    compare.mode,
    compare.baseRef,
    compare.ignoreWhitespace,
  );
  const canLoad = enabled && Boolean(client) && isConnected && cwd.length > 0 && path.length > 0;

  return useFetchQuery<ImageDiffPayload>({
    queryKey,
    queryFn: () => {
      if (!client) {
        throw new Error("Daemon client unavailable");
      }
      return client.checkoutGetImageDiff(
        cwd,
        { path, ...(oldPath ? { oldPath } : {}), compare },
        `imageDiff:${serverId}:${cwd}:${path}:${Date.now()}`,
      );
    },
    enabled: canLoad,
    dataShape: "value",
    staleTimeMs: 30_000,
  });
}
