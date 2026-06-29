import type { ParsedDiffFile } from "./use-diff-query";

export function shouldRenderImageDiffBody(file: ParsedDiffFile): boolean {
  return file.status === "binary" && file.binaryKind === "image";
}
