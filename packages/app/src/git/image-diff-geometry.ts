import type { DimensionValue } from "react-native";

export function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function renderedImageSwipePosition({
  frameHeight,
  frameWidth,
  imageHeight,
  imageWidth,
  swipePosition,
}: {
  frameHeight: number;
  frameWidth: number;
  imageHeight: number;
  imageWidth: number;
  swipePosition: number;
}): number {
  if (frameWidth <= 0 || frameHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return swipePosition;
  }

  const renderedImageWidth = Math.min(frameWidth, frameHeight * (imageWidth / imageHeight));
  const inset = ((frameWidth - renderedImageWidth) / 2 / frameWidth) * 100;
  const renderedWidth = (renderedImageWidth / frameWidth) * 100;
  return inset + renderedWidth * (swipePosition / 100);
}

export function swipePositionFromRenderedFramePosition({
  frameHeight,
  frameWidth,
  imageHeight,
  imageWidth,
  framePosition,
}: {
  frameHeight: number;
  frameWidth: number;
  imageHeight: number;
  imageWidth: number;
  framePosition: number;
}): number {
  if (frameWidth <= 0 || frameHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return clampPercentage(framePosition);
  }

  const renderedImageWidth = Math.min(frameWidth, frameHeight * (imageWidth / imageHeight));
  const inset = ((frameWidth - renderedImageWidth) / 2 / frameWidth) * 100;
  const renderedWidth = (renderedImageWidth / frameWidth) * 100;
  if (renderedWidth <= 0) {
    return clampPercentage(framePosition);
  }

  return clampPercentage(((framePosition - inset) / renderedWidth) * 100);
}

export function swipePositionFromFrameLocation({
  frameHeight,
  frameWidth,
  imageHeight,
  imageWidth,
  locationX,
}: {
  frameHeight: number;
  frameWidth: number;
  imageHeight: number;
  imageWidth: number;
  locationX: number;
}): number {
  const framePosition = frameWidth <= 0 ? locationX : (locationX / frameWidth) * 100;
  return swipePositionFromRenderedFramePosition({
    frameHeight,
    frameWidth,
    imageHeight,
    imageWidth,
    framePosition,
  });
}

export function compactSliderValueFromLocation({
  locationX,
  width,
}: {
  locationX: number;
  width: number;
}): number {
  if (width <= 0) {
    return clampPercentage(locationX);
  }
  return clampPercentage(Math.round((locationX / width) * 100));
}

export function percentageWidth(value: number): DimensionValue {
  return `${clampPercentage(value)}%` as DimensionValue;
}
