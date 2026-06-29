import { describe, expect, it } from "vitest";
import {
  compactSliderValueFromLocation,
  renderedImageSwipePosition,
  swipePositionFromFrameLocation,
  swipePositionFromRenderedFramePosition,
} from "./image-diff-geometry";

describe("image diff geometry", () => {
  it("maps swipe position to the rendered image edges after layout", () => {
    expect(
      swipePositionFromFrameLocation({
        frameHeight: 260,
        frameWidth: 400,
        imageHeight: 100,
        imageWidth: 100,
        locationX: 70,
      }),
    ).toBe(0);

    expect(
      swipePositionFromFrameLocation({
        frameHeight: 260,
        frameWidth: 400,
        imageHeight: 100,
        imageWidth: 100,
        locationX: 330,
      }),
    ).toBe(100);

    expect(
      swipePositionFromFrameLocation({
        frameHeight: 260,
        frameWidth: 400,
        imageHeight: 100,
        imageWidth: 100,
        locationX: 200,
      }),
    ).toBe(50);

    expect(
      renderedImageSwipePosition({
        frameHeight: 260,
        frameWidth: 400,
        imageHeight: 100,
        imageWidth: 100,
        swipePosition: 0,
      }),
    ).toBe(17.5);

    expect(
      renderedImageSwipePosition({
        frameHeight: 260,
        frameWidth: 400,
        imageHeight: 100,
        imageWidth: 100,
        swipePosition: 100,
      }),
    ).toBe(82.5);

    expect(
      swipePositionFromRenderedFramePosition({
        frameHeight: 260,
        frameWidth: 400,
        imageHeight: 100,
        imageWidth: 100,
        framePosition: 17.5,
      }),
    ).toBe(0);

    expect(
      swipePositionFromRenderedFramePosition({
        frameHeight: 260,
        frameWidth: 400,
        imageHeight: 100,
        imageWidth: 100,
        framePosition: 82.5,
      }),
    ).toBe(100);
  });

  it("maps compact slider gestures to percentages", () => {
    expect(compactSliderValueFromLocation({ locationX: 56, width: 140 })).toBe(40);
    expect(compactSliderValueFromLocation({ locationX: -10, width: 140 })).toBe(0);
    expect(compactSliderValueFromLocation({ locationX: 200, width: 140 })).toBe(100);
  });
});
