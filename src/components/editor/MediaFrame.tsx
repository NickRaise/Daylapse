import { forwardRef, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { colors, radius } from "@/theme";
import type { AspectRatio } from "@/types";
import type { EditorMedia } from "@/store/editor.store";

const H_PAD = 16; // horizontal padding inside the editor

/** Returns the width/height ratio for a given base ratio + orientation. */
export function computeFrameRatio(
  ratio: AspectRatio,
  orientation: "portrait" | "landscape",
): number {
  if (ratio === "1:1") return 1;
  const [w, h] = ratio.split(":").map(Number);
  const base = w / h; // e.g. 4/3 ≈ 1.33
  return orientation === "landscape" ? base : 1 / base;
}

type Props = {
  media: EditorMedia;
  aspectRatio: AspectRatio;
  orientation: "portrait" | "landscape";
  gesturesEnabled?: boolean;
  children?: React.ReactNode;
};

export const MediaFrame = forwardRef<View, Props>(function MediaFrame(
  { media, aspectRatio, orientation, gesturesEnabled = true, children },
  ref,
) {
  const { width: screenW } = useWindowDimensions();
  const frameW = screenW - H_PAD * 2;
  const frameH = frameW / computeFrameRatio(aspectRatio, orientation);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTX = useSharedValue(0);
  const savedTY = useSharedValue(0);

  const player = useVideoPlayer(
    media.type === "video" && !media.isLoading ? media.uri : null,
    (p) => {
      p.loop = true;
      p.muted = false;
    },
  );

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .enabled(gesturesEnabled)
        .onUpdate((e) => {
          scale.value = Math.max(1, Math.min(6, savedScale.value * e.scale));
        })
        .onEnd(() => {
          savedScale.value = scale.value;
        }),
    [gesturesEnabled],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(gesturesEnabled)
        .onUpdate((e) => {
          translateX.value = savedTX.value + e.translationX;
          translateY.value = savedTY.value + e.translationY;
        })
        .onEnd(() => {
          savedTX.value = translateX.value;
          savedTY.value = translateY.value;
        }),
    [gesturesEnabled],
  );

  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .enabled(gesturesEnabled)
        .onEnd(() => {
          scale.value = withTiming(1);
          savedScale.value = 1;
          translateX.value = withTiming(0);
          translateY.value = withTiming(0);
          savedTX.value = 0;
          savedTY.value = 0;
        }),
    [gesturesEnabled],
  );

  const composed = useMemo(
    () => Gesture.Simultaneous(Gesture.Race(doubleTap, pan), pinch),
    [doubleTap, pan, pinch],
  );

  const mediaStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View
      ref={ref}
      style={[styles.frame, { width: frameW, height: frameH }]}
      collapsable={false} // required for react-native-view-shot
    >
      <GestureDetector gesture={composed}>
        <Animated.View style={[StyleSheet.absoluteFill, mediaStyle]}>
          {media.type === "photo" ? (
            <Image
              source={{ uri: media.uri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <VideoView
              style={StyleSheet.absoluteFill}
              player={player}
              nativeControls={false}
              contentFit="cover"
            />
          )}
        </Animated.View>
      </GestureDetector>

      {/* Overlays: caption, date stamp — included in view capture */}
      {children}

      <View style={styles.border} pointerEvents="none" />
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.textPrimary,
    borderRadius: radius.lg,
    overflow: "hidden",
    alignSelf: "center",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
});
