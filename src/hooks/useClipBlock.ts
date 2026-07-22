import { useEffect, useRef, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import type { ScrollView } from "react-native-gesture-handler";
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import type { VideoPlayer } from "expo-video";
import type { TrimRange } from "@/components/editor/TrimPanel";

const PPS = 40; // pixels per second — reel scale

type Options = {
  dur: number;
  viewportW: number;
  player: VideoPlayer;
  playheadSV: SharedValue<number>;
  scrollRef: React.RefObject<ScrollView | null>;
  onRangeChange: (r: TrimRange) => void;
  onSeek: (t: number) => void;
};

export function useClipBlock({
  dur,
  viewportW,
  player,
  playheadSV,
  scrollRef,
  onRangeChange,
  onSeek,
}: Options) {
  const [clipDuration, setClipDuration] = useState(1);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const safeClipDur = Math.min(clipDuration, dur);
  const contentWidth = viewportW > 0 ? Math.max(viewportW, Math.ceil(dur * PPS)) : 0;

  const durSV    = useSharedValue(dur);
  const contentW = useSharedValue(0);
  const blockX   = useSharedValue(0);
  const blockW   = useSharedValue(0);
  const blockSaved = useSharedValue(0);
  const clipStartRef = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => { durSV.value = dur; }, [dur]);

  // Recalculate block geometry whenever viewport/duration/clip length changes.
  // Also emits the initial onRangeChange so the parent has a valid range.
  useEffect(() => {
    if (viewportW <= 0 || !dur) return;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeClipDur, dur, viewportW]);

  function applyClipDuration(seconds: number) {
    const clamped = Math.max(0.5, Math.min(seconds, dur));
    setClipDuration(clamped);
    const startT = clipStartRef.current;
    const clampedStart = Math.min(startT, Math.max(0, dur - clamped));
    clipStartRef.current = clampedStart;
    if (contentWidth > 0) blockX.value = withTiming((clampedStart / dur) * contentWidth);
    onRangeChange({ start: clampedStart, end: Math.min(clampedStart + clamped, dur) });
  }

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

  function stepBlock(direction: number) {
    if (player.playing) player.pause();
    const maxStart = Math.max(0, dur - safeClipDur);
    const newStart = Math.max(0, Math.min(maxStart, clipStartRef.current + direction * safeClipDur));
    clipStartRef.current = newStart;
    if (contentWidth > 0) blockX.value = withTiming((newStart / dur) * contentWidth, { duration: 80 });
    player.currentTime = newStart;
    onSeek(newStart);
    onRangeChange({ start: newStart, end: Math.min(newStart + safeClipDur, dur) });
    if (scrollRef.current && contentWidth > viewportW) {
      const bx = (newStart / dur) * contentWidth;
      scrollRef.current.scrollTo({ x: Math.max(0, bx - viewportW * 0.2), animated: true });
    }
  }

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

  // All animated styles run on the UI thread — no React re-renders in the hot path.
  const dimLeftStyle  = useAnimatedStyle(() => ({ width: Math.max(0, blockX.value) }));
  const dimRightStyle = useAnimatedStyle(() => ({ left: blockX.value + blockW.value }));
  const blockStyle    = useAnimatedStyle(() => ({ left: blockX.value, width: Math.max(0, blockW.value) }));
  const needleStyle   = useAnimatedStyle(() => ({
    transform: [{
      translateX:
        contentW.value > 0 && durSV.value > 0.001
          ? (playheadSV.value / durSV.value) * contentW.value
          : 0,
    }],
  }));

  return {
    scrollEnabled,
    clipStartRef,
    clipDuration,
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
  };
}
