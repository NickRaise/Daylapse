import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as VideoThumbnails from "expo-video-thumbnails";
import type { VideoPlayer } from "expo-video";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, fontSize, spacing } from "@/theme";

export type TrimRange = { start: number; end: number };

const STRIP_H = 64;
const THUMB_COUNT = 10;
const STEP_S = 1; // back/next step in seconds

const PRESET_DURATIONS = [1, 3, 5, 10] as const;

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toFixed(1).padStart(4, "0")}`;
}

type Props = {
  videoUri: string;
  player: VideoPlayer;
  duration: number;
  onRangeChange: (r: TrimRange) => void;
  playhead: number;
  onSeek: (time: number) => void;
};

export function TrimPanel({
  videoUri,
  player,
  duration,
  onRangeChange,
  playhead,
  onSeek,
}: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [thumbUris, setThumbUris] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(player.playing);
  const [clipDuration, setClipDuration] = useState(1);
  const [customText, setCustomText] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const generatingRef = useRef(false);
  // Blocks the auto-follow useEffect while a drag gesture is active
  const isDragging = useRef(false);
  // JS-side position tracking (avoids reading shared value from JS thread)
  const clipStartRef = useRef(0);

  const dur = Math.max(duration, 0.001);
  const safeClipDur = Math.min(clipDuration, dur);
  const maxStart = Math.max(0, dur - safeClipDur);

  // ── Shared values ─────────────────────────────────────────────────────────
  const trackW = useSharedValue(0);
  const durSV = useSharedValue(dur);
  const blockX = useSharedValue(0); // left edge of block in px
  const blockW = useSharedValue(0); // width of block in px
  const blockSaved = useSharedValue(0);

  useEffect(() => { durSV.value = dur; }, [dur]);

  // Recompute block width whenever clip duration or track width changes
  useEffect(() => {
    if (trackWidth <= 0 || !duration) return;
    blockW.value = (safeClipDur / dur) * trackWidth;
    // Also re-clamp position so block doesn't overflow
    const maxX = Math.max(0, trackWidth - blockW.value);
    if (blockX.value > maxX) blockX.value = withTiming(maxX);
  }, [safeClipDur, duration, trackWidth]);

  // Auto-follow playhead (both while playing and after seeks)
  useEffect(() => {
    if (isDragging.current || trackWidth <= 0 || !duration) return;
    const startT = Math.min(playhead, maxStart);
    clipStartRef.current = startT;
    blockX.value = withTiming((startT / dur) * trackWidth, { duration: 50 });
    onRangeChange({ start: startT, end: Math.min(startT + safeClipDur, dur) });
  }, [playhead, trackWidth, duration, safeClipDur]);

  // Track playing state
  useEffect(() => {
    setIsPlaying(player.playing);
    const sub = player.addListener("playingChange", ({ isPlaying: p }) =>
      setIsPlaying(p),
    );
    return () => sub.remove();
  }, [player]);

  // ── Thumbnail generation ──────────────────────────────────────────────────
  useEffect(() => {
    if (trackWidth < 10 || !duration || !videoUri || generatingRef.current) return;
    generatingRef.current = true;
    const times = Array.from({ length: THUMB_COUNT }, (_, i) =>
      Math.round((i / (THUMB_COUNT - 1)) * duration * 1000),
    );
    Promise.all(
      times.map((t) =>
        VideoThumbnails.getThumbnailAsync(videoUri, { time: t, quality: 0.4 })
          .then((r) => r.uri)
          .catch(() => ""),
      ),
    ).then((uris) => {
      setThumbUris(uris.filter(Boolean));
      generatingRef.current = false;
    });
  }, [trackWidth, duration, videoUri]);

  // ── Clip duration helpers ─────────────────────────────────────────────────
  function applyClipDuration(seconds: number) {
    const clamped = Math.max(0.5, Math.min(seconds, dur));
    setClipDuration(clamped);
    // Recompute range with current position
    const startT = clipStartRef.current;
    const clampedStart = Math.min(startT, Math.max(0, dur - clamped));
    clipStartRef.current = clampedStart;
    blockX.value = withTiming((clampedStart / dur) * trackWidth);
    onRangeChange({ start: clampedStart, end: Math.min(clampedStart + clamped, dur) });
  }

  function handleCustomSubmit() {
    const v = parseFloat(customText);
    if (!isNaN(v) && v > 0) applyClipDuration(v);
  }

  // ── Back / Next ───────────────────────────────────────────────────────────
  function stepBlock(delta: number) {
    if (player.playing) player.pause();
    const newStart = Math.max(0, Math.min(maxStart, clipStartRef.current + delta));
    clipStartRef.current = newStart;
    blockX.value = withTiming((newStart / dur) * trackWidth, { duration: 80 });
    player.currentTime = newStart;
    onSeek(newStart);
    onRangeChange({ start: newStart, end: Math.min(newStart + safeClipDur, dur) });
  }

  // ── Drag gesture (block is draggable only when video is paused) ───────────
  function beginDrag() {
    isDragging.current = true;
    if (player.playing) player.pause();
  }

  function endDrag(rawT: number) {
    const startT = Math.max(0, Math.min(maxStart, rawT));
    clipStartRef.current = startT;
    isDragging.current = false;
    player.currentTime = startT;
    onSeek(startT);
    onRangeChange({ start: startT, end: Math.min(startT + safeClipDur, dur) });
  }

  const blockPan = Gesture.Pan()
    .activeOffsetX([-2, 2])
    .failOffsetY([-15, 15])
    .onBegin(() => {
      "worklet";
      blockSaved.value = blockX.value;
      runOnJS(beginDrag)();
    })
    .onUpdate((e) => {
      "worklet";
      const maxX = trackW.value - blockW.value;
      blockX.value = Math.max(0, Math.min(maxX, blockSaved.value + e.translationX));
    })
    .onEnd(() => {
      "worklet";
      const t = (blockX.value / trackW.value) * durSV.value;
      runOnJS(endDrag)(t);
    });

  // ── Animated styles ───────────────────────────────────────────────────────
  const dimLeftStyle = useAnimatedStyle(() => ({
    width: Math.max(0, blockX.value),
  }));
  const dimRightStyle = useAnimatedStyle(() => ({
    left: Math.min(blockX.value + blockW.value, trackW.value),
  }));
  const blockStyle = useAnimatedStyle(() => ({
    left: blockX.value,
    width: Math.max(0, blockW.value),
  }));

  const thumbW = trackWidth > 0 ? trackWidth / THUMB_COUNT : 0;
  const clipEndDisplay = Math.min(clipStartRef.current + safeClipDur, dur);

  return (
    <View style={s.root}>

      {/* ── 1. Playback controls — centred, play button prominent ── */}
      <View style={s.controls}>
        <View style={s.controlsSide} />

        <View style={s.btnGroup}>
          <Pressable style={s.stepBtn} hitSlop={12} onPress={() => stepBlock(-STEP_S)}>
            <FontAwesomeFreeSolid name="backward-step" size={13} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={s.playBtn}
            hitSlop={8}
            onPress={() => (isPlaying ? player.pause() : player.play())}
          >
            <FontAwesomeFreeSolid
              name={isPlaying ? "pause" : "play"}
              size={15}
              color={colors.textOnAccent}
            />
          </Pressable>

          <Pressable style={s.stepBtn} hitSlop={12} onPress={() => stepBlock(STEP_S)}>
            <FontAwesomeFreeSolid name="forward-step" size={13} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={s.controlsSide}>
          <Text style={s.timeDisplay}>
            {fmt(playhead)}
            <Text style={s.timeSep}> / </Text>
            {fmt(duration)}
          </Text>
        </View>
      </View>

      {/* ── 2. Trimmer reel ── */}
      <View
        style={s.timelineContainer}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setTrackWidth(w);
          trackW.value = w;
        }}
      >
        <View style={s.strip} pointerEvents="none">
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

        {trackWidth > 0 && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <GestureDetector gesture={blockPan}>
              <Animated.View style={[s.block, blockStyle]}>
                <View style={[s.bracket, s.bracketLeft]} />
                <View style={[s.bracket, s.bracketRight]} />
                <View style={s.blockBorderTop} />
                <View style={s.blockBorderBottom} />
              </Animated.View>
            </GestureDetector>
          </View>
        )}
      </View>

      {/* ── 3. Duration only — centred, primary colour ── */}
      <Text style={s.clipDurLabel}>{safeClipDur.toFixed(1)}s</Text>

      {/* ── 4. Clip length selector — secondary, at bottom ── */}
      <View style={s.durationRow}>
        <Text style={s.durationLabel}>Clip</Text>
        {PRESET_DURATIONS.map((d) => {
          const active = !isCustom && clipDuration === d;
          return (
            <Pressable
              key={d}
              style={[s.pill, active && s.pillActive]}
              onPress={() => { setIsCustom(false); applyClipDuration(d); }}
            >
              <Text style={[s.pillText, active && s.pillTextActive]}>{d}s</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={[s.pill, isCustom && s.pillActive]}
          onPress={() => setIsCustom(true)}
        >
          {isCustom ? (
            <TextInput
              style={s.customInput}
              value={customText}
              onChangeText={setCustomText}
              onSubmitEditing={handleCustomSubmit}
              onBlur={handleCustomSubmit}
              keyboardType="decimal-pad"
              placeholder="s"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              autoFocus
              maxLength={5}
            />
          ) : (
            <Text style={[s.pillText, isCustom && s.pillTextActive]}>Custom</Text>
          )}
        </Pressable>
      </View>

    </View>
  );
}

const BRACKET_W = 8;
const BORDER_H = 3;

const s = StyleSheet.create({
  root: { gap: spacing[3] },

  // Duration selector
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    flexWrap: "wrap",
  },
  durationLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginRight: 2,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
    minWidth: 40,
    alignItems: "center",
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.textOnAccent,
    fontWeight: "600",
  },
  customInput: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textOnAccent,
    minWidth: 40,
    textAlign: "center",
    padding: 0,
  },

  // Controls
  controls: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlsSide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  btnGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  timeDisplay: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  timeSep: { color: colors.textMuted },

  // Timeline container — no overflow:hidden so block at edges gets touches
  timelineContainer: {
    height: STRIP_H,
  },

  // Strip — overflow:hidden for visual
  strip: {
    ...StyleSheet.absoluteFill,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  thumbRow: {
    flexDirection: "row",
    height: STRIP_H,
  },
  thumbPlaceholder: {
    height: STRIP_H,
    backgroundColor: "#2a2a2a",
    borderRightWidth: 1,
    borderRightColor: "#111",
  },

  // Dim overlays
  dim: {
    position: "absolute",
    top: 0,
    height: STRIP_H,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  dimLeft: { left: 0 },
  dimRight: { right: 0 },

  // Draggable clip block
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
    backgroundColor: colors.primary,
  },
  bracketLeft: { left: 0, borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
  bracketRight: { right: 0, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  blockBorderTop: {
    position: "absolute",
    top: 0,
    left: BRACKET_W,
    right: BRACKET_W,
    height: BORDER_H,
    backgroundColor: colors.primary,
  },
  blockBorderBottom: {
    position: "absolute",
    bottom: 0,
    left: BRACKET_W,
    right: BRACKET_W,
    height: BORDER_H,
    backgroundColor: colors.primary,
  },

  clipDurLabel: {
    textAlign: "center",
    fontSize: fontSize.base,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.3,
  },
});
