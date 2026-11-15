import { forwardRef, useEffect, useMemo } from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { type VideoPlayer, VideoView } from "expo-video";
import { makeStyles, radius, useColors } from "@/theme";
import type { AspectRatio } from "@/types";
import type { EditorMedia } from "@/store/editor.store";
import type { EditorZoom } from "@/hooks/useEditorZoom";
import useSettingsStore from "@/store/settings.store";

const MAX_ZOOM = 6;

const H_PAD = 16;

function baseFrameRatio(ratio: AspectRatio): number {
  if (ratio === "1:1") return 1;
  const [w, h] = ratio.split(":").map(Number);
  return w / h;
}

export function frameSize(ratio: AspectRatio, screenWidth: number) {
  const w = screenWidth - H_PAD * 2;
  return { width: w, height: w / baseFrameRatio(ratio) };
}

type Props = {
  media: EditorMedia;
  aspectRatio: AspectRatio;
  /** "landscape" → media covers the frame (cover). "portrait" → full media visible (contain). */
  fit: "landscape" | "portrait";
  /** Player created by the parent (via useVideoPlayer). Only used when media.type === "video". */
  player: VideoPlayer;
  /** Real pixel size of the media; needed to keep panning inside the media's own edges. */
  mediaSize: { width: number; height: number } | null;
  zoom: EditorZoom;
  gesturesEnabled?: boolean;
  children?: React.ReactNode;
};

export const MediaFrame = forwardRef<View, Props>(function MediaFrame(
  { media, aspectRatio, fit, player, mediaSize, zoom, gesturesEnabled = true, children },
  ref,
) {
  const colors = useColors();
  const frameFillColor = useSettingsStore((s) => s.frameFillColor);
  const fillColor =
    frameFillColor === "white" ? "#FFFFFF" : frameFillColor === "theme" ? colors.bg : "#000000";
  const s = useStyles();
  const { width: screenW } = useWindowDimensions();
  const { width: frameW, height: frameH } = frameSize(aspectRatio, screenW);

  const contentFit = fit === "landscape" ? "cover" : "contain";

  const { scale, translateX, translateY, savedScale, savedX, savedY } = zoom;

  // Switching cover/contain changes what 1x means, so any zoom from the old mode no longer applies.
  useEffect(() => {
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = 1;
    savedX.value = 0;
    savedY.value = 0;
  }, [fit]);

  // The media's on-screen size at 1x; unknown size falls back to the frame itself.
  const fitScale = mediaSize
    ? contentFit === "cover"
      ? Math.max(frameW / mediaSize.width, frameH / mediaSize.height)
      : Math.min(frameW / mediaSize.width, frameH / mediaSize.height)
    : 0;
  const shownW = mediaSize ? mediaSize.width * fitScale : frameW;
  const shownH = mediaSize ? mediaSize.height * fitScale : frameH;

  const gestures = useMemo(() => {
    // Movement only uses the room zooming in created: no empty space opens up, and a striped axis stays centred until the media fills it.
    const clamp = (v: number, s: number, shown: number, size: number) => {
      "worklet";
      const max = Math.max(0, (shown * s - Math.max(shown, size)) / 2);
      return Math.max(-max, Math.min(max, v));
    };

    const pinch = Gesture.Pinch()
      .enabled(gesturesEnabled)
      .onUpdate((e) => {
        const s = Math.max(1, Math.min(MAX_ZOOM, savedScale.value * e.scale));
        scale.value = s;
        translateX.value = clamp(savedX.value, s, shownW, frameW);
        translateY.value = clamp(savedY.value, s, shownH, frameH);
      })
      .onEnd(() => {
        savedScale.value = scale.value;
        savedX.value = translateX.value;
        savedY.value = translateY.value;
      });

    const pan = Gesture.Pan()
      .enabled(gesturesEnabled)
      .averageTouches(true)
      .onUpdate((e) => {
        translateX.value = clamp(savedX.value + e.translationX, scale.value, shownW, frameW);
        translateY.value = clamp(savedY.value + e.translationY, scale.value, shownH, frameH);
      })
      .onEnd(() => {
        savedX.value = translateX.value;
        savedY.value = translateY.value;
      });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .enabled(gesturesEnabled)
      .onEnd(() => {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedX.value = 0;
        savedY.value = 0;
      });

    return Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));
  }, [gesturesEnabled, frameW, frameH, shownW, shownH]);

  // Photos are saved by snapshotting this view, so their zoom is applied as real layout (size + position), which the snapshot always includes.
  const photoStyle = useAnimatedStyle(() => {
    const w = frameW * scale.value;
    const h = frameH * scale.value;
    return {
      position: "absolute",
      width: w,
      height: h,
      left: (frameW - w) / 2 + translateX.value,
      top: (frameH - h) / 2 + translateY.value,
    };
  });

  // Videos are re-framed by FFmpeg from the saved zoom values, so a cheap transform is enough for the preview.
  const videoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Rounding and border live on the outer wrapper only — the inner view is what gets captured on save, so it stays a plain rectangle.
  return (
    <View style={[s.frame, { width: frameW, height: frameH }]}>
      <View
        ref={ref}
        style={{ width: frameW, height: frameH, backgroundColor: fillColor, overflow: "hidden" }}
        collapsable={false}
      >
        <GestureDetector gesture={gestures}>
          <View style={StyleSheet.absoluteFill}>
            {media.type === "photo" ? (
              <Animated.View style={photoStyle}>
                <Image
                  source={{ uri: media.uri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode={contentFit}
                />
              </Animated.View>
            ) : (
              <Animated.View style={[StyleSheet.absoluteFill, videoStyle]}>
                <VideoView
                  style={StyleSheet.absoluteFill}
                  player={player}
                  nativeControls={false}
                  contentFit={contentFit}
                />
              </Animated.View>
            )}
          </View>
        </GestureDetector>

        {children}
      </View>

      <View style={s.border} pointerEvents="none" />
    </View>
  );
});

const useStyles = makeStyles(() => ({
  frame: {
    borderRadius: radius.lg,
    overflow: "hidden",
    alignSelf: "center",
  },
  border: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
}));
