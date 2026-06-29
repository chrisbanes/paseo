import { skipToken, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { CheckoutDiffGetImageResponse } from "@getpaseo/protocol/messages";
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
  const activeClient = canLoad ? client : null;

  return useQuery<ImageDiffPayload>({
    queryKey,
    queryFn: activeClient
      ? () =>
          activeClient.checkoutGetImageDiff(
            cwd,
            { path, ...(oldPath ? { oldPath } : {}), compare },
            `imageDiff:${serverId}:${cwd}:${path}:${Date.now()}`,
          )
      : skipToken,
    staleTime: 0,
  });
}
