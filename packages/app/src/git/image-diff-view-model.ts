import type { TFunction } from "i18next";
import type { ImageDiffPayload } from "./use-image-diff-query";

export type ImageSidePayload = ImageDiffPayload["oldImage"];
export type DiffImagePayload = ImageDiffPayload["diffImage"];
export type AvailableImage = Extract<ImageSidePayload, { status: "available" }>;
export type ImageDiffMode = "two-up" | "swipe" | "onion";
export type ImageDiffHeight = "default" | "large";

export const IMAGE_DIFF_MODES: ImageDiffMode[] = ["two-up", "swipe", "onion"];

export function availableImageOrNull(
  image: ImageSidePayload | DiffImagePayload,
): AvailableImage | null {
  return image.status === "available" ? image : null;
}

export function canCompareImages(payload: ImageDiffPayload): boolean {
  return (
    availableImageOrNull(payload.oldImage) !== null &&
    availableImageOrNull(payload.newImage) !== null
  );
}

export function isAddedImage(payload: ImageDiffPayload): boolean {
  return payload.oldImage.status === "missing" && payload.newImage.status === "available";
}

export function modeLabel(mode: ImageDiffMode, t: TFunction): string {
  switch (mode) {
    case "two-up":
      return t("workspace.git.imageDiff.twoUp");
    case "swipe":
      return t("workspace.git.imageDiff.swipe");
    case "onion":
      return t("workspace.git.imageDiff.onionSkin");
  }
}

export function heightLabel(height: ImageDiffHeight, t: TFunction): string {
  switch (height) {
    case "default":
      return t("workspace.git.imageDiff.heightDefault");
    case "large":
      return t("workspace.git.imageDiff.heightLarge");
  }
}

export function imageStatusLabel(
  status: Exclude<ImageSidePayload | DiffImagePayload, { status: "available" | "missing" }>,
  t: TFunction,
): string {
  switch (status.status) {
    case "too_large":
      return `${t("workspace.git.imageDiff.tooLarge")} (${formatImageDiffSize(status.size)})`;
    case "unsupported":
      return t("workspace.git.imageDiff.unsupported");
    case "read_error":
      return status.message || t("workspace.git.imageDiff.readError");
    case "invalid":
      return status.message || t("workspace.git.imageDiff.invalid");
    case "dimension_mismatch":
      return t("workspace.git.imageDiff.dimensionsChanged", {
        oldWidth: status.oldWidth,
        oldHeight: status.oldHeight,
        newWidth: status.newWidth,
        newHeight: status.newHeight,
      });
  }
}

export function imageUri(image: AvailableImage): string {
  return `data:${image.mimeType};base64,${image.content}`;
}

export function formatImageDiffSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
