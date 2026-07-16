import type { TFunction } from "i18next";
import { Eye, EyeClosed, Maximize2, ScanEye } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from "react-native-svg";
import {
  ActivityIndicator,
  Image as RNImage,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import {
  compactSliderValueFromLocation,
  percentageWidth,
  renderedImageSwipePosition,
  swipePositionFromFrameLocation,
} from "./image-diff-geometry";
import {
  IMAGE_DIFF_MODES,
  availableImageOrNull,
  canCompareImages,
  formatImageDiffSize,
  heightLabel,
  imageStatusLabel,
  imageUri,
  isAddedImage,
  modeLabel,
  type AvailableImage,
  type DiffImagePayload,
  type ImageDiffHeight,
  type ImageDiffMode,
  type ImageSidePayload,
} from "./image-diff-view-model";
import { useImageDiffQuery } from "./use-image-diff-query";

interface ImageDiffBodyProps {
  serverId: string;
  cwd: string;
  path: string;
  oldPath?: string;
  mode: "uncommitted" | "base";
  baseRef?: string;
  enabled: boolean;
  onOpenFile?: (path: string) => void;
}

interface IconTheme {
  colors: {
    foregroundMuted: string;
    surface0: string;
  };
}

const DEFAULT_IMAGE_DIFF_HEIGHT = 260;
const LARGE_IMAGE_DIFF_HEIGHT = 420;
const SWIPE_HANDLE_WIDTH = 32;
const COMPACT_SLIDER_WIDTH = 140;
const XRAY_OVERLAY_OPACITY = 0.65;

const foregroundMutedIconColorMapping = (theme: IconTheme) => ({
  color: theme.colors.foregroundMuted,
});
const surfaceIconColorMapping = (theme: IconTheme) => ({ color: theme.colors.surface0 });
const ThemedEye = withUnistyles(Eye);
const ThemedEyeClosed = withUnistyles(EyeClosed);
const ThemedMaximize2 = withUnistyles(Maximize2);
const ThemedScanEye = withUnistyles(ScanEye);

export function ImageDiffBody(props: ImageDiffBodyProps) {
  const { path, onOpenFile } = props;
  const { t } = useTranslation();
  const query = useImageDiffQuery(props);
  const [diffMode, setDiffMode] = React.useState<ImageDiffMode>("two-up");
  const [showDiffOverlay, setShowDiffOverlay] = React.useState(false);
  const [swipePosition, setSwipePosition] = React.useState(50);
  const [onionOpacity, setOnionOpacity] = React.useState(50);
  const [imageHeight, setImageHeight] = React.useState<ImageDiffHeight>("default");
  const openCurrentFile = React.useCallback(() => {
    onOpenFile?.(path);
  }, [onOpenFile, path]);
  const toggleDiffOverlay = React.useCallback(() => {
    setShowDiffOverlay((visible) => !visible);
  }, []);

  if (query.isLoading || !query.data) {
    return (
      <View style={styles.stateRow}>
        <ActivityIndicator size="small" />
        <Text style={styles.stateText}>{t("workspace.git.imageDiff.loading")}</Text>
      </View>
    );
  }

  if (query.data.error) {
    return <StatusMessage label={query.data.error.message} />;
  }

  const oldTitle = t("workspace.git.imageDiff.old");
  const newTitle = t("workspace.git.imageDiff.new");
  const addedImage = isAddedImage(query.data);
  const oldAvailable = availableImageOrNull(query.data.oldImage);
  const newAvailable = availableImageOrNull(query.data.newImage);
  const canCompare = canCompareImages(query.data);
  const diffOverlay =
    showDiffOverlay && query.data.diffImage.status === "available" ? query.data.diffImage : null;

  return (
    <View style={styles.root}>
      <ImageDiffToolbar
        canCompare={!addedImage && canCompare}
        diffImage={query.data.diffImage}
        diffMode={diffMode}
        imageHeight={imageHeight}
        showDiffOverlay={showDiffOverlay}
        onDiffModeChange={setDiffMode}
        onHeightChange={setImageHeight}
        onToggleDiffOverlay={toggleDiffOverlay}
        t={t}
      />
      <ImageDiffContent
        diffMode={diffMode}
        imageHeight={imageHeight}
        oldTitle={oldTitle}
        newTitle={newTitle}
        oldImage={query.data.oldImage}
        newImage={query.data.newImage}
        oldAvailable={oldAvailable}
        newAvailable={newAvailable}
        addedImage={addedImage}
        diffOverlay={diffOverlay}
        diffOverlayOpacity={XRAY_OVERLAY_OPACITY}
        swipePosition={swipePosition}
        onSwipePositionChange={setSwipePosition}
        onionOpacity={onionOpacity / 100}
        onOpenCurrentFile={openCurrentFile}
        t={t}
      />
      {diffMode === "onion" && (
        <View style={styles.sliderRows} testID="image-diff-slider-rows">
          <ImageDiffSlider
            label={t("workspace.git.imageDiff.onionOpacity")}
            value={onionOpacity}
            onValueChange={setOnionOpacity}
          />
        </View>
      )}
    </View>
  );
}

function ImageDiffToolbar({
  canCompare,
  diffImage,
  diffMode,
  imageHeight,
  showDiffOverlay,
  onDiffModeChange,
  onHeightChange,
  onToggleDiffOverlay,
  t,
}: {
  canCompare: boolean;
  diffImage: DiffImagePayload;
  diffMode: ImageDiffMode;
  imageHeight: ImageDiffHeight;
  showDiffOverlay: boolean;
  onDiffModeChange: (mode: ImageDiffMode) => void;
  onHeightChange: (height: ImageDiffHeight) => void;
  onToggleDiffOverlay: () => void;
  t: TFunction;
}) {
  const compareModeLabel = React.useCallback((mode: ImageDiffMode) => modeLabel(mode, t), [t]);
  const toggleImageHeight = React.useCallback(() => {
    onHeightChange(imageHeight === "large" ? "default" : "large");
  }, [imageHeight, onHeightChange]);
  const heightButtonLabel = heightLabel(imageHeight, t);
  const isLargeHeight = imageHeight === "large";

  if (!canCompare) {
    return null;
  }

  return (
    <View style={styles.toolbar} testID="image-diff-toolbar">
      <ModePicker
        mode={diffMode}
        modes={IMAGE_DIFF_MODES}
        onChange={onDiffModeChange}
        labelForMode={compareModeLabel}
      />
      {diffImage.status === "available" ? (
        <Pressable
          accessibilityLabel={t("workspace.git.imageDiff.xray")}
          accessibilityRole="button"
          aria-pressed={showDiffOverlay}
          onPress={onToggleDiffOverlay}
          style={showDiffOverlay ? styles.iconButtonSelected : styles.iconButton}
        >
          <ThemedScanEye
            size={14}
            uniProps={showDiffOverlay ? surfaceIconColorMapping : foregroundMutedIconColorMapping}
          />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityLabel={heightButtonLabel}
        accessibilityRole="button"
        aria-pressed={isLargeHeight}
        onPress={toggleImageHeight}
        style={isLargeHeight ? styles.iconButtonSelected : styles.iconButton}
      >
        <ThemedMaximize2
          size={14}
          uniProps={isLargeHeight ? surfaceIconColorMapping : foregroundMutedIconColorMapping}
        />
      </Pressable>
    </View>
  );
}

function ImageDiffContent({
  diffMode,
  imageHeight,
  oldTitle,
  newTitle,
  oldImage,
  newImage,
  oldAvailable,
  newAvailable,
  addedImage,
  diffOverlay,
  diffOverlayOpacity,
  swipePosition,
  onSwipePositionChange,
  onionOpacity,
  onOpenCurrentFile,
  t,
}: {
  diffMode: ImageDiffMode;
  imageHeight: ImageDiffHeight;
  oldTitle: string;
  newTitle: string;
  oldImage: ImageSidePayload;
  newImage: ImageSidePayload;
  oldAvailable: AvailableImage | null;
  newAvailable: AvailableImage | null;
  addedImage: boolean;
  diffOverlay: AvailableImage | null;
  diffOverlayOpacity: number;
  swipePosition: number;
  onSwipePositionChange: (value: number) => void;
  onionOpacity: number;
  onOpenCurrentFile: () => void;
  t: TFunction;
}) {
  const panelHeight = imageHeight === "large" ? LARGE_IMAGE_DIFF_HEIGHT : DEFAULT_IMAGE_DIFF_HEIGHT;
  if (addedImage) {
    return (
      <View style={styles.container}>
        <ImagePanel
          title={newTitle}
          image={newImage}
          emptyLabel={t("workspace.git.imageDiff.imageDeleted")}
          onOpenImage={onOpenCurrentFile}
          overlayImage={diffOverlay}
          overlayOpacity={diffOverlayOpacity}
          height={panelHeight}
        />
      </View>
    );
  }

  if (diffMode === "swipe" && oldAvailable && newAvailable) {
    return (
      <View style={styles.container}>
        <SwipeView
          oldImage={oldAvailable}
          newImage={newAvailable}
          overlayImage={diffOverlay}
          overlayOpacity={diffOverlayOpacity}
          swipePosition={swipePosition}
          onSwipePositionChange={onSwipePositionChange}
          height={panelHeight}
        />
      </View>
    );
  }

  if (diffMode === "onion" && oldAvailable && newAvailable) {
    return (
      <View style={styles.container}>
        <OnionSkinView
          oldImage={oldAvailable}
          newImage={newAvailable}
          overlayImage={diffOverlay}
          overlayOpacity={diffOverlayOpacity}
          onionOpacity={onionOpacity}
          height={panelHeight}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImagePanel
        title={oldTitle}
        image={oldImage}
        emptyLabel={t("workspace.git.imageDiff.noPreviousImage")}
        height={panelHeight}
      />
      <ImagePanel
        title={newTitle}
        image={newImage}
        emptyLabel={t("workspace.git.imageDiff.imageDeleted")}
        onOpenImage={onOpenCurrentFile}
        overlayImage={diffOverlay}
        overlayOpacity={diffOverlayOpacity}
        height={panelHeight}
      />
    </View>
  );
}

function ModePicker({
  mode,
  modes,
  onChange,
  labelForMode,
}: {
  mode: ImageDiffMode;
  modes: readonly ImageDiffMode[];
  onChange: (mode: ImageDiffMode) => void;
  labelForMode: (mode: ImageDiffMode) => string;
}) {
  return (
    <View style={styles.modePicker}>
      {modes.map((modeOption) => {
        const selected = mode === modeOption;
        return (
          <ModeButton
            key={modeOption}
            label={labelForMode(modeOption)}
            mode={modeOption}
            selected={selected}
            onChange={onChange}
          />
        );
      })}
    </View>
  );
}

function ImageDiffSlider({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
}) {
  const handleSliderGesture = React.useCallback(
    (event: GestureResponderEvent) => {
      onValueChange(
        compactSliderValueFromLocation({
          locationX: event.nativeEvent.locationX,
          width: COMPACT_SLIDER_WIDTH,
        }),
      );
    },
    [onValueChange],
  );
  const fillStyle = React.useMemo(
    () => [styles.sliderLineFill, { width: percentageWidth(value) }],
    [value],
  );
  const thumbStyle = React.useMemo(
    () => [styles.sliderThumb, { left: percentageWidth(value) }],
    [value],
  );
  const roundedValue = Math.round(value);
  const accessibilityValue = React.useMemo(
    () => ({ min: 0, max: 100, now: roundedValue }),
    [roundedValue],
  );

  return (
    <View style={styles.sliderRow} testID="image-diff-slider-row">
      <ThemedEyeClosed
        size={12}
        testID="image-diff-slider-low-icon"
        uniProps={foregroundMutedIconColorMapping}
      />
      <View style={styles.sliderTrackContainer} testID="image-diff-slider-track">
        <View
          accessibilityLabel={label}
          accessibilityRole="adjustable"
          accessibilityValue={accessibilityValue}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={roundedValue}
          onMoveShouldSetResponder={returnTrue}
          onResponderGrant={handleSliderGesture}
          onResponderMove={handleSliderGesture}
          onStartShouldSetResponder={returnTrue}
          style={styles.slider}
          testID="image-diff-slider-control"
        >
          <View style={styles.sliderLine} testID="image-diff-slider-line">
            <View style={fillStyle} />
          </View>
          <View style={thumbStyle} testID="image-diff-slider-thumb" />
        </View>
      </View>
      <ThemedEye
        size={12}
        testID="image-diff-slider-high-icon"
        uniProps={foregroundMutedIconColorMapping}
      />
    </View>
  );
}

function ModeButton({
  label,
  mode,
  selected,
  onChange,
}: {
  label: string;
  mode: ImageDiffMode;
  selected: boolean;
  onChange: (mode: ImageDiffMode) => void;
}) {
  const handlePress = React.useCallback(() => {
    onChange(mode);
  }, [mode, onChange]);

  return (
    <Pressable
      accessibilityRole="button"
      aria-pressed={selected}
      onPress={handlePress}
      style={selected ? styles.modeButtonSelected : styles.modeButton}
    >
      <Text style={selected ? styles.modeButtonTextSelected : styles.modeButtonText}>{label}</Text>
    </Pressable>
  );
}

function SwipeView({
  oldImage,
  newImage,
  overlayImage,
  overlayOpacity,
  swipePosition,
  onSwipePositionChange,
  height,
}: {
  oldImage: AvailableImage;
  newImage: AvailableImage;
  overlayImage: AvailableImage | null;
  overlayOpacity: number;
  swipePosition: number;
  onSwipePositionChange: (value: number) => void;
  height: number;
}) {
  const { t } = useTranslation();
  const oldSource = React.useMemo(() => ({ uri: imageUri(oldImage) }), [oldImage]);
  const newSource = React.useMemo(() => ({ uri: imageUri(newImage) }), [newImage]);
  const [frameWidth, setFrameWidth] = React.useState(0);
  const handleFrameLayout = React.useCallback((event: LayoutChangeEvent) => {
    setFrameWidth(event.nativeEvent.layout.width);
  }, []);
  const effectiveSwipePosition = renderedImageSwipePosition({
    frameHeight: height,
    frameWidth,
    imageHeight: newImage.height,
    imageWidth: newImage.width,
    swipePosition,
  });
  const frameStyle = React.useMemo(() => [styles.compareFrame, { height }], [height]);
  const swipeClipStyle = React.useMemo(
    () => [styles.swipeClip, { width: percentageWidth(effectiveSwipePosition) }],
    [effectiveSwipePosition],
  );
  const swipeImageFrameStyle = React.useMemo(
    () => [styles.compareImage, { width: frameWidth > 0 ? frameWidth : percentageWidth(100) }],
    [frameWidth],
  );
  const handleSwipeDrag = React.useCallback(
    (event: GestureResponderEvent) => {
      if (frameWidth <= 0) {
        return;
      }

      onSwipePositionChange(
        swipePositionFromFrameLocation({
          frameHeight: height,
          frameWidth,
          imageHeight: newImage.height,
          imageWidth: newImage.width,
          locationX: event.nativeEvent.locationX,
        }),
      );
    },
    [frameWidth, height, newImage.height, newImage.width, onSwipePositionChange],
  );
  const swipeHandleStyle = React.useMemo(
    () => [styles.swipeHandle, { left: percentageWidth(effectiveSwipePosition) }],
    [effectiveSwipePosition],
  );

  return (
    <View style={styles.comparePanel} testID="image-diff-swipe-view">
      <View
        onLayout={handleFrameLayout}
        onMoveShouldSetResponder={returnTrue}
        onResponderGrant={handleSwipeDrag}
        onResponderMove={handleSwipeDrag}
        onStartShouldSetResponder={returnTrue}
        style={frameStyle}
        testID="image-diff-compare-frame"
      >
        <RNImage source={oldSource} style={styles.compareImage} resizeMode="contain" />
        <View style={swipeClipStyle} testID="image-diff-swipe-clip">
          <RNImage
            source={newSource}
            style={swipeImageFrameStyle}
            resizeMode="contain"
            testID="image-diff-swipe-new-image"
          />
        </View>
        {overlayImage ? <OverlayImage image={overlayImage} opacity={overlayOpacity} /> : null}
        <View
          accessibilityLabel={t("workspace.git.imageDiff.swipePosition")}
          accessibilityRole="adjustable"
          style={swipeHandleStyle}
          testID="image-diff-swipe-divider"
        >
          <SwipeDividerLine />
          <View style={styles.swipeHandleGrip} testID="image-diff-swipe-handle">
            <View style={styles.swipeHandleGripMark} testID="image-diff-swipe-handle-grip" />
            <View style={styles.swipeHandleGripMark} testID="image-diff-swipe-handle-grip" />
          </View>
        </View>
      </View>
      <Text style={styles.metaText}>
        {newImage.width} x {newImage.height} · {formatImageDiffSize(newImage.size)}
      </Text>
    </View>
  );
}

function SwipeDividerLine() {
  return (
    <View style={styles.swipeDividerLine} testID="image-diff-swipe-divider-gradient">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient id="imageDiffSwipeDivider" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity={0.95} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0.6} />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#imageDiffSwipeDivider)" />
      </Svg>
    </View>
  );
}

function OnionSkinView({
  oldImage,
  newImage,
  overlayImage,
  overlayOpacity,
  onionOpacity,
  height,
}: {
  oldImage: AvailableImage;
  newImage: AvailableImage;
  overlayImage: AvailableImage | null;
  overlayOpacity: number;
  onionOpacity: number;
  height: number;
}) {
  const oldSource = React.useMemo(() => ({ uri: imageUri(oldImage) }), [oldImage]);
  const newSource = React.useMemo(() => ({ uri: imageUri(newImage) }), [newImage]);
  const frameStyle = React.useMemo(() => [styles.compareFrame, { height }], [height]);
  const onionImageStyle = React.useMemo(
    () => [styles.onionImage, { opacity: onionOpacity }],
    [onionOpacity],
  );

  return (
    <View style={styles.comparePanel} testID="image-diff-onion-view">
      <View style={frameStyle} testID="image-diff-compare-frame">
        <RNImage source={oldSource} style={styles.compareImage} resizeMode="contain" />
        <RNImage
          source={newSource}
          style={onionImageStyle}
          resizeMode="contain"
          testID="image-diff-onion-image"
        />
        {overlayImage ? <OverlayImage image={overlayImage} opacity={overlayOpacity} /> : null}
      </View>
      <Text style={styles.metaText}>
        {newImage.width} x {newImage.height} · {formatImageDiffSize(newImage.size)}
      </Text>
    </View>
  );
}

function ImagePanel({
  title,
  image,
  emptyLabel,
  onOpenImage,
  overlayImage,
  overlayOpacity = 0.65,
  height,
}: {
  title: string;
  image: ImageSidePayload;
  emptyLabel: string;
  onOpenImage?: () => void;
  overlayImage?: AvailableImage | null;
  overlayOpacity?: number;
  height: number;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <PanelContent
        image={image}
        emptyLabel={emptyLabel}
        title={title}
        t={t}
        onOpenImage={onOpenImage}
        overlayImage={overlayImage}
        overlayOpacity={overlayOpacity}
        height={height}
      />
    </View>
  );
}

function PanelContent({
  image,
  emptyLabel,
  title,
  t,
  onOpenImage,
  overlayImage,
  overlayOpacity,
  height,
}: {
  image: ImageSidePayload | DiffImagePayload;
  emptyLabel: string;
  title: string;
  t: TFunction;
  onOpenImage?: () => void;
  overlayImage?: AvailableImage | null;
  overlayOpacity: number;
  height: number;
}) {
  if (image.status === "available") {
    return (
      <AvailableImageView
        image={image}
        title={title}
        onOpenImage={onOpenImage}
        overlayImage={overlayImage}
        overlayOpacity={overlayOpacity}
        height={height}
      />
    );
  }
  if (image.status === "missing") {
    return <StatusMessage label={emptyLabel} />;
  }
  return <StatusMessage label={imageStatusLabel(image, t)} />;
}

function AvailableImageView({
  image,
  title,
  onOpenImage,
  overlayImage,
  overlayOpacity,
  height,
}: {
  image: AvailableImage;
  title: string;
  onOpenImage?: () => void;
  overlayImage?: AvailableImage | null;
  overlayOpacity: number;
  height: number;
}) {
  const source = React.useMemo(() => ({ uri: imageUri(image) }), [image]);
  const surfaceStyle = React.useMemo(() => [styles.imageSurface, { height }], [height]);
  const { t } = useTranslation();
  const imageContent = (
    <View style={surfaceStyle} testID="image-diff-panel-surface">
      <RNImage
        source={source}
        style={styles.panelImage}
        resizeMode="contain"
        testID="image-diff-panel-image"
      />
      {overlayImage ? <OverlayImage image={overlayImage} opacity={overlayOpacity} /> : null}
    </View>
  );

  return (
    <View style={styles.imageFrame}>
      {onOpenImage ? (
        <Pressable
          accessibilityLabel={t("workspace.git.imageDiff.openImagePreview", { title })}
          accessibilityRole="button"
          onPress={onOpenImage}
          testID="image-diff-panel-image-button"
        >
          {imageContent}
        </Pressable>
      ) : (
        imageContent
      )}
      <Text style={styles.metaText}>
        {image.width} x {image.height} · {formatImageDiffSize(image.size)}
      </Text>
    </View>
  );
}

function OverlayImage({ image, opacity }: { image: AvailableImage; opacity: number }) {
  const source = React.useMemo(() => ({ uri: imageUri(image) }), [image]);
  const style = React.useMemo(() => [styles.overlayImage, { opacity }], [opacity]);
  return (
    <RNImage source={source} style={style} resizeMode="contain" testID="image-diff-overlay-image" />
  );
}

function returnTrue() {
  return true;
}

function StatusMessage({ label }: { label: string }) {
  return (
    <View style={styles.statusContainer}>
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    gap: theme.spacing[3],
    padding: theme.spacing[3],
  },
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[3],
  },
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing[2],
  },
  modePicker: {
    alignSelf: "flex-start",
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface1,
  },
  modeButton: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  iconButton: {
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface1,
    padding: theme.spacing[2],
  },
  modeButtonSelected: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    backgroundColor: theme.colors.foreground,
  },
  iconButtonSelected: {
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[2],
    backgroundColor: theme.colors.foreground,
  },
  modeButtonText: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  modeButtonTextSelected: {
    color: theme.colors.surface0,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  sliderRows: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  sliderRow: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  sliderTrackContainer: {
    width: COMPACT_SLIDER_WIDTH,
    justifyContent: "center",
  },
  slider: {
    width: COMPACT_SLIDER_WIDTH,
    height: 12,
    justifyContent: "center",
  },
  sliderLine: {
    height: 2,
    overflow: "hidden",
    borderRadius: 1,
    backgroundColor: theme.colors.foregroundMuted,
  },
  sliderLineFill: {
    height: "100%",
    backgroundColor: theme.colors.foreground,
  },
  sliderThumb: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.foreground,
    transform: [{ translateX: -4 }],
  },
  panel: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 0,
    gap: theme.spacing[2],
  },
  panelTitle: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  imageFrame: {
    minHeight: 180,
    gap: theme.spacing[2],
  },
  imageSurface: {
    width: "100%",
    height: 180,
    overflow: "hidden",
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.borderRadius.md,
  },
  panelImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  comparePanel: {
    flexGrow: 1,
    flexBasis: 360,
    minWidth: 0,
    gap: theme.spacing[2],
  },
  compareFrame: {
    height: 260,
    overflow: "hidden",
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.borderRadius.md,
  },
  compareImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  swipeClip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "50%",
    overflow: "hidden",
  },
  swipeHandle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: SWIPE_HANDLE_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -SWIPE_HANDLE_WIDTH / 2 }],
  },
  swipeDividerLine: {
    position: "absolute",
    width: 1,
    height: "100%",
  },
  swipeHandleGrip: {
    width: 14,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface0,
    borderWidth: theme.borderWidth[1],
    borderColor: theme.colors.foregroundMuted,
  },
  swipeHandleGripMark: {
    width: 6,
    height: 1,
    borderRadius: 1,
    backgroundColor: theme.colors.foregroundMuted,
  },
  onionImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.5,
  },
  overlayImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.65,
  },
  metaText: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.xs,
  },
  stateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
  },
  stateText: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.xs,
  },
  statusContainer: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[3],
  },
  statusText: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.xs,
    textAlign: "center",
  },
}));
