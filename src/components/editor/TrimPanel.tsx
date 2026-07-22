import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScrollView, Gesture, GestureDetector } from "react-native-gesture-handler";
import { Image } from "expo-image";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import * as VideoThumbnails from "expo-video-thumbnails";
import type { VideoPlayer } from "expo-video";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, fontSize, spacing } from "@/theme";

export type TrimRange = { start: number; end: number };

const STRIP_H = 64;
const THUMB_COUNT = 10;
// At 40 px/s, the reel starts scrolling for videos longer than ~8 s
// (assuming ~320 px viewport). Short videos fill the full width naturally.
const PPS = 40;

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
  playhead: number;            // React state — used for display + scroll
  playheadSV: SharedValue<number>; // Reanimated shared value — drives the needle on UI thread
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
  const [thumbUris, setThumbUris] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(player.playing);
  const [clipDuration, setClipDuration] = useState(1);
  const [customText, setCustomText] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const scrollRef = useRef<ScrollView>(null);
  const generatingRef = useRef(false);
  const isDragging = useRef(false);
  const clipStartRef = useRef(0);

  const dur = Math.max(duration, 0.001);
  const safeClipDur = Math.min(clipDuration, dur);

  // Content width: viewport width OR duration × PPS, whichever is larger.
  // For short videos this equals viewportW (no scroll). For long videos it extends.
  const contentWidth = viewportW > 0 ? Math.max(viewportW, Math.ceil(dur * PPS)) : 0;
  const thumbW = contentWidth > 0 ? contentWidth / THUMB_COUNT : 0;

  // ── Shared values ──────────────────────────────────────────────────────────
  const durSV    = useSharedValue(dur);
  const contentW = useSharedValue(0); // full reel content width
  const blockX   = useSharedValue(0); // block left edge in content px
  const blockW   = useSharedValue(0); // block width in content px
  const blockSaved = useSharedValue(0);
  // needleX is intentionally absent — needle is derived from playheadSV in useAnimatedStyle

  useEffect(() => { durSV.value = dur; }, [dur]);

  // Recalculate block geometry whenever viewport/duration/clipDuration change.
  // Also emits the initial onRangeChange so editor.tsx has a valid clip range.
  useEffect(() => {
    if (viewportW <= 0 || !duration) return;
    const cw = Math.max(viewportW, Math.ceil(dur * PPS));
    contentW.value = cw;

    const bw = (safeClipDur / dur) * cw;
    blockW.value = bw;

    const maxX = Math.max(0, cw - bw);
    if (blockX.value > maxX) {
      blockX.value = withTiming(maxX);
      clipStartRef.current = (maxX / cw) * dur;
    }
    onRangeChange({ start: clipStartRef.current, end: Math.min(clipStartRef.current + safeClipDur, dur) });
  }, [safeClipDur, duration, viewportW]);

  // Scroll auto-follow: keep the needle visible during playback.
  // Uses React-state playhead (~10 fps) — precision not needed for scrolling.
  useEffect(() => {
    if (!scrollRef.current || contentWidth <= viewportW || !isPlaying) return;
    const nx = (playhead / dur) * contentWidth;
    scrollRef.current.scrollTo({ x: Math.max(0, nx - viewportW * 0.35), animated: false });
  }, [playhead, contentWidth, isPlaying]);

  // Track playing state
  useEffect(() => {
    setIsPlaying(player.playing);
    const sub = player.addListener("playingChange", ({ isPlaying: p }) => setIsPlaying(p));
    return () => sub.remove();
  }, [player]);

  // ── Thumbnail generation ───────────────────────────────────────────────────
  useEffect(() => {
    if (viewportW < 10 || !duration || !videoUri || generatingRef.current) return;
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
  }, [viewportW, duration, videoUri]);

  // ── Clip duration helpers ──────────────────────────────────────────────────
  function applyClipDuration(seconds: number) {
    const clamped = Math.max(0.5, Math.min(seconds, dur));
    setClipDuration(clamped);
    const startT = clipStartRef.current;
    const clampedStart = Math.min(startT, Math.max(0, dur - clamped));
    clipStartRef.current = clampedStart;
    if (contentWidth > 0) blockX.value = withTiming((clampedStart / dur) * contentWidth);
    onRangeChange({ start: clampedStart, end: Math.min(clampedStart + clamped, dur) });
  }

  function handleCustomSubmit() {
    const v = parseFloat(customText);
    if (!isNaN(v) && v > 0) applyClipDuration(v);
  }

  // ── Tap anywhere on reel → move clip block + seek to that point ───────────
  function handleReelTap(t: number) {
    const maxStart = Math.max(0, dur - safeClipDur);
    const startT = Math.max(0, Math.min(maxStart, t));
    clipStartRef.current = startT;
    if (contentWidth > 0) blockX.value = withTiming((startT / dur) * contentWidth, { duration: 80 });
    player.currentTime = startT;
    onSeek(startT);
    onRangeChange({ start: startT, end: Math.min(startT + safeClipDur, dur) });
  }

  const reelTap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      "worklet";
      const t = (e.x / contentW.value) * durSV.value;
      runOnJS(handleReelTap)(Math.max(0, Math.min(durSV.value, t)));
    });

  // ── Step — moves by one full clip length ───────────────────────────────────
  function stepBlock(direction: number) {
    if (player.playing) player.pause();
    const maxStart = Math.max(0, dur - safeClipDur);
    const newStart = Math.max(0, Math.min(maxStart, clipStartRef.current + direction * safeClipDur));
    clipStartRef.current = newStart;
    if (contentWidth > 0) blockX.value = withTiming((newStart / dur) * contentWidth, { duration: 80 });
    player.currentTime = newStart;
    onSeek(newStart);
    onRangeChange({ start: newStart, end: Math.min(newStart + safeClipDur, dur) });
    // Scroll to keep block visible
    if (scrollRef.current && contentWidth > viewportW) {
      const bx = (newStart / dur) * contentWidth;
      scrollRef.current.scrollTo({ x: Math.max(0, bx - viewportW * 0.2), animated: true });
    }
  }

  // ── Drag gesture ───────────────────────────────────────────────────────────
  function beginDrag() {
    isDragging.current = true;
    setScrollEnabled(false);
    if (player.playing) player.pause();
  }

  function endDrag(rawT: number) {
    const maxStart = Math.max(0, dur - safeClipDur);
    const startT = Math.max(0, Math.min(maxStart, rawT));
    clipStartRef.current = startT;
    isDragging.current = false;
    setScrollEnabled(true);
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
      const maxX = contentW.value - blockW.value;
      blockX.value = Math.max(0, Math.min(maxX, blockSaved.value + e.translationX));
    })
    .onEnd(() => {
      "worklet";
      const t = (blockX.value / contentW.value) * durSV.value;
      runOnJS(endDrag)(t);
    });

  // ── Animated styles ────────────────────────────────────────────────────────
  const dimLeftStyle  = useAnimatedStyle(() => ({ width: Math.max(0, blockX.value) }));
  const dimRightStyle = useAnimatedStyle(() => ({ left: blockX.value + blockW.value }));
  const blockStyle    = useAnimatedStyle(() => ({ left: blockX.value, width: Math.max(0, blockW.value) }));
  // Needle runs entirely on the UI thread — no React re-render in the hot path.
  const needleStyle   = useAnimatedStyle(() => ({
    transform: [{
      translateX: contentW.value > 0 && durSV.value > 0.001
        ? (playheadSV.value / durSV.value) * contentW.value
        : 0,
    }],
  }));

  return (
    <View style={s.root}>

      {/* ── 1. Controls ── */}
      <View style={s.controls}>
        <View style={s.controlsSide} />
        <View style={s.btnGroup}>
          <Pressable style={s.stepBtn} hitSlop={12} onPress={() => stepBlock(-1)}>
            <FontAwesomeFreeSolid name="backward-step" size={13} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            style={s.playBtn}
            hitSlop={8}
            onPress={() => {
              if (isPlaying) {
                player.pause();
              } else {
                player.currentTime = clipStartRef.current;
                player.play();
              }
            }}
          >
            <FontAwesomeFreeSolid
              name={isPlaying ? "pause" : "play"}
              size={15}
              color={colors.textOnAccent}
            />
          </Pressable>
          <Pressable style={s.stepBtn} hitSlop={12} onPress={() => stepBlock(1)}>
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

      {/* ── 2. Reel (scrollable for long videos) ── */}
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
          {/* Tap anywhere on the reel to place the clip + seek */}
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

            {/* Playhead needle */}
            <Animated.View style={[s.needle, needleStyle]} pointerEvents="none" />

          </View>
          </GestureDetector>
        </ScrollView>
      </View>

      {/* ── 3. Duration label ── */}
      <Text style={s.clipDurLabel}>{safeClipDur.toFixed(1)}s</Text>

      {/* ── 4. Clip length selector ── */}
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

  // Controls
  controls: { flexDirection: "row", alignItems: "center" },
  controlsSide: { flex: 1, justifyContent: "center", alignItems: "flex-end" },
  btnGroup: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  stepBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1, borderColor: colors.border,
    justifyContent: "center", alignItems: "center",
  },
  playBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: "center", alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  timeDisplay: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  timeSep: { color: colors.textMuted },

  // Reel container — clip touches so no overflow:hidden here
  timelineContainer: { height: STRIP_H },

  // Visual strip — overflow:hidden for rounded corners
  strip: {
    position: "absolute", top: 0, left: 0, bottom: 0,
    borderRadius: 6, overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  thumbRow: { flexDirection: "row", height: STRIP_H },
  thumbPlaceholder: {
    height: STRIP_H, backgroundColor: "#2a2a2a",
    borderRightWidth: 1, borderRightColor: "#111",
  },

  // Dim overlays
  dim: { position: "absolute", top: 0, height: STRIP_H, backgroundColor: "rgba(0,0,0,0.6)" },
  dimLeft:  { left: 0 },
  dimRight: { right: 0 },

  // Draggable clip block
  block: {
    position: "absolute", top: 0, height: STRIP_H,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "visible",
  },
  bracket: {
    position: "absolute", top: 0,
    width: BRACKET_W, height: STRIP_H,
    backgroundColor: colors.primary,
  },
  bracketLeft:  { left: 0,  borderTopLeftRadius: 3,  borderBottomLeftRadius: 3  },
  bracketRight: { right: 0, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  blockBorderTop: {
    position: "absolute", top: 0, left: BRACKET_W, right: BRACKET_W,
    height: BORDER_H, backgroundColor: colors.primary,
  },
  blockBorderBottom: {
    position: "absolute", bottom: 0, left: BRACKET_W, right: BRACKET_W,
    height: BORDER_H, backgroundColor: colors.primary,
  },

  // Playhead needle
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

  clipDurLabel: {
    textAlign: "center",
    fontSize: fontSize.base,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.3,
  },

  durationRow: {
    flexDirection: "row", alignItems: "center",
    gap: spacing[2], flexWrap: "wrap",
  },
  durationLabel: {
    fontSize: fontSize.xs, fontWeight: "600",
    color: colors.textMuted, textTransform: "uppercase",
    letterSpacing: 0.5, marginRight: 2,
  },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: "transparent", minWidth: 40, alignItems: "center",
  },
  pillActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText:       { fontSize: fontSize.sm, fontWeight: "500", color: colors.textSecondary },
  pillTextActive: { color: colors.textOnAccent, fontWeight: "600" },
  customInput: {
    fontSize: fontSize.sm, fontWeight: "600", color: colors.textOnAccent,
    minWidth: 40, textAlign: "center", padding: 0,
  },
});
