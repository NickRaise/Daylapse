import { forwardRef, useMemo } from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { type VideoPlayer, VideoView } from "expo-video";
import { colors, radius } from "@/theme";
import type { AspectRatio } from "@/types";
import type { EditorMedia } from "@/store/editor.store";

const H_PAD = 16;

export function baseFrameRatio(ratio: AspectRatio): number {
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
  gesturesEnabled?: boolean;
  children?: React.ReactNode;
};

export const MediaFrame = forwardRef<View, Props>(function MediaFrame(
  { media, aspectRatio, fit, player, gesturesEnabled = true, children },
  ref,
) {
  const { width: screenW } = useWindowDimensions();
  const { width: frameW, height: frameH } = frameSize(aspectRatio, screenW);

  const contentFit = fit === "landscape" ? "cover" : "contain";

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

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

  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .enabled(gesturesEnabled)
        .onEnd(() => {
          scale.value = withTiming(1);
          savedScale.value = 1;
        }),
    [gesturesEnabled],
  );

  const composed = useMemo(
    () => Gesture.Race(doubleTap, pinch),
    [doubleTap, pinch],
  );

  const mediaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      ref={ref}
      style={[s.frame, { width: frameW, height: frameH }]}
      collapsable={false}
    >
      <GestureDetector gesture={composed}>
        <Animated.View style={[StyleSheet.absoluteFill, mediaStyle]}>
          {media.type === "photo" ? (
            <Image
              source={{ uri: media.uri }}
              style={StyleSheet.absoluteFill}
              resizeMode={contentFit}
            />
          ) : (
            <VideoView
              style={StyleSheet.absoluteFill}
              player={player}
              nativeControls={false}
              contentFit={contentFit}
            />
          )}
        </Animated.View>
      </GestureDetector>

      {children}

      <View style={s.border} pointerEvents="none" />
    </View>
  );
});

const s = StyleSheet.create({
  frame: {
    backgroundColor: "#000",
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
});
