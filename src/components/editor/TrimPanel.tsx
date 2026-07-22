import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ScrollView, GestureDetector } from "react-native-gesture-handler";
import { Image } from "expo-image";
import Animated, { type SharedValue } from "react-native-reanimated";
import type { VideoPlayer } from "expo-video";
import { useClipBlock } from "@/hooks/useClipBlock";
import { useThumbnails, THUMB_COUNT } from "@/hooks/useThumbnails";
import { TrimControls } from "@/components/editor/TrimControls";
import { ClipDurationPicker } from "@/components/editor/ClipDurationPicker";

export type TrimRange = { start: number; end: number };

const STRIP_H = 64;
const BRACKET_W = 8;
const BORDER_H = 3;

type Props = {
  videoUri: string;
  player: VideoPlayer;
  duration: number;
  onRangeChange: (r: TrimRange) => void;
  playhead: number;
  playheadSV: SharedValue<number>;
  onSeek: (time: number) => void;
};

export function TrimPanel({
  videoUri,
  player,
  duration,
  onRangeChange,
  playhead,
  playheadSV,
  onSeek,
}: Props) {
  const [viewportW, setViewportW] = useState(0);
  const [isPlaying, setIsPlaying] = useState(player.playing);
  const scrollRef = useRef<ScrollView>(null);

  const dur = Math.max(duration, 0.001);

  const {
    scrollEnabled,
    clipStartRef,
    safeClipDur,
    contentWidth,
    applyClipDuration,
    blockPan,
    reelTap,
    stepBlock,
    dimLeftStyle,
    dimRightStyle,
    blockStyle,
    needleStyle,
  } = useClipBlock({ dur, viewportW, player, playheadSV, scrollRef, onRangeChange, onSeek });

  const { thumbUris } = useThumbnails(videoUri, duration, viewportW);
  const thumbW = contentWidth > 0 ? contentWidth / THUMB_COUNT : 0;

  // Scroll auto-follow: keep needle visible during playback.
  useEffect(() => {
    if (!scrollRef.current || contentWidth <= viewportW || !isPlaying) return;
    const nx = (playhead / dur) * contentWidth;
    scrollRef.current.scrollTo({ x: Math.max(0, nx - viewportW * 0.35), animated: false });
  }, [playhead, contentWidth, isPlaying]);

  useEffect(() => {
    setIsPlaying(player.playing);
    const sub = player.addListener("playingChange", ({ isPlaying: p }) => setIsPlaying(p));
    return () => sub.remove();
  }, [player]);

  return (
    <View style={s.root}>

      <TrimControls
        isPlaying={isPlaying}
        playhead={playhead}
        duration={duration}
        onPlay={() => { player.currentTime = clipStartRef.current; player.play(); }}
        onPause={() => player.pause()}
        onStepBack={() => stepBlock(-1)}
        onStepForward={() => stepBlock(1)}
      />

      <View
        style={s.timelineContainer}
        onLayout={(e) => setViewportW(e.nativeEvent.layout.width)}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          scrollEnabled={scrollEnabled}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          style={StyleSheet.absoluteFill}
        >
          <GestureDetector gesture={reelTap}>
            <View style={{ width: contentWidth, height: STRIP_H }}>

              {/* Thumbnails + dim overlays */}
              <View style={[s.strip, { width: contentWidth }]} pointerEvents="none">
                <View style={s.thumbRow}>
                  {thumbUris.length > 0
                    ? thumbUris.map((uri, i) => (
                        <Image
                          key={i}
                          source={{ uri }}
                          style={{ width: thumbW, height: STRIP_H }}
                          contentFit="cover"
                        />
                      ))
                    : Array.from({ length: THUMB_COUNT }).map((_, i) => (
                        <View key={i} style={[s.thumbPlaceholder, { width: thumbW }]} />
                      ))}
                </View>
                <Animated.View style={[s.dim, s.dimLeft, dimLeftStyle]} />
                <Animated.View style={[s.dim, s.dimRight, dimRightStyle]} />
              </View>

              {/* Draggable clip block */}
              {contentWidth > 0 && (
                <GestureDetector gesture={blockPan}>
                  <Animated.View style={[s.block, blockStyle]}>
                    <View style={[s.bracket, s.bracketLeft]} />
                    <View style={[s.bracket, s.bracketRight]} />
                    <View style={s.blockBorderTop} />
                    <View style={s.blockBorderBottom} />
                  </Animated.View>
                </GestureDetector>
              )}

              {/* Playhead needle — driven by shared value, zero React re-renders */}
              <Animated.View style={[s.needle, needleStyle]} pointerEvents="none" />

            </View>
          </GestureDetector>
        </ScrollView>
      </View>

      <ClipDurationPicker
        currentDuration={safeClipDur}
        maxDuration={dur}
        onDurationChange={applyClipDuration}
      />

    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: 12 },

  timelineContainer: { height: STRIP_H },

  strip: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  thumbRow: { flexDirection: "row", height: STRIP_H },
  thumbPlaceholder: {
    height: STRIP_H,
    backgroundColor: "#2a2a2a",
    borderRightWidth: 1,
    borderRightColor: "#111",
  },

  dim: {
    position: "absolute",
    top: 0,
    height: STRIP_H,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  dimLeft:  { left: 0 },
  dimRight: { right: 0 },

  block: {
    position: "absolute",
    top: 0,
    height: STRIP_H,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "visible",
  },
  bracket: {
    position: "absolute",
    top: 0,
    width: BRACKET_W,
    height: STRIP_H,
    backgroundColor: "#6C47FF",
  },
  bracketLeft:  { left: 0,  borderTopLeftRadius: 3,  borderBottomLeftRadius: 3 },
  bracketRight: { right: 0, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  blockBorderTop: {
    position: "absolute",
    top: 0,
    left: BRACKET_W,
    right: BRACKET_W,
    height: BORDER_H,
    backgroundColor: "#6C47FF",
  },
  blockBorderBottom: {
    position: "absolute",
    bottom: 0,
    left: BRACKET_W,
    right: BRACKET_W,
    height: BORDER_H,
    backgroundColor: "#6C47FF",
  },

  needle: {
    position: "absolute",
    top: 4,
    left: 0,
    width: 2,
    height: STRIP_H - 8,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 4,
  },
});
