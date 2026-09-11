import { useEffect, useRef, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import type { ScrollView } from "react-native-gesture-handler";
import {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import type { VideoPlayer } from "expo-video";
import type { TrimRange } from "@/components/editor/TrimPanel";

const BASE_PPS = 40; // px/sec at base zoom — strip fills the screen below this, scrolls above
const NUDGE_STEP = 0.1; // seconds — precise step/hold increment for the trim buttons
const SEEK_THROTTLE_MS = 120; // cap native seeks during a fast hold/drag

type Options = {
  dur: number;
  viewportW: number;
  player: VideoPlayer;
  playheadSV: SharedValue<number>;
  scrollRef: React.RefObject<ScrollView | null>;
  onRangeChange: (r: TrimRange) => void;
};

/**
 * Block-on-strip trim model. The film-strip is flush-left and fills the screen
 * when the video is short, only overflowing (and becoming scrollable) when it's
 * too long to fit. A draggable selection box (plus the step buttons) sets the
 * clip start. `startSV` is the single source of truth — the box, the dim masks
 * and the resting playhead are all derived from it, so the needle can't drift
 * from the selection.
 */
export function useClipTrim({
  dur,
  viewportW,
  player,
  playheadSV,
  scrollRef,
  onRangeChange,
}: Options) {
  const [clipDuration, setClipDuration] = useState(1);
  const safeClipDur = Math.min(clipDuration, dur);

  const stripW = viewportW > 0 ? Math.max(viewportW, Math.ceil(dur * BASE_PPS)) : 0;
  const pxPerSec = dur > 0 ? stripW / dur : 0;
  const scrollEnabled = stripW > viewportW + 1;

  const durSV = useSharedValue(dur);
  const clipDurSV = useSharedValue(safeClipDur);
  const ppsSV = useSharedValue(pxPerSec);
  const stripWSV = useSharedValue(stripW);
  const startSV = useSharedValue(0);
  const startSaved = useSharedValue(0);

  const clipStartRef = useRef(0);

  // Native seeks are expensive; a held button or fast drag would otherwise fire
  // one per frame. Throttle them (leading + trailing) so scrubbing stays smooth
  // while still landing an accurate final frame.
  const seekRef = useRef<{
    last: number;
    timer: ReturnType<typeof setTimeout> | null;
    pending: number | null;
  }>({ last: 0, timer: null, pending: null });

  function seekNow(t: number) {
    const st = seekRef.current;
    if (st.timer) { clearTimeout(st.timer); st.timer = null; }
    st.pending = null;
    st.last = Date.now();
    player.currentTime = t;
  }

  function seekThrottled(t: number) {
    const st = seekRef.current;
    const elapsed = Date.now() - st.last;
    if (elapsed >= SEEK_THROTTLE_MS) { seekNow(t); return; }
    st.pending = t;
    if (!st.timer) {
      st.timer = setTimeout(() => {
        st.timer = null;
        if (st.pending != null) seekNow(st.pending);
      }, SEEK_THROTTLE_MS - elapsed);
    }
  }

  useEffect(() => {
    return () => { if (seekRef.current.timer) clearTimeout(seekRef.current.timer); };
  }, []);

  // Mirror derived geometry into shared values for the worklets.
  useEffect(() => {
    durSV.value = dur;
    clipDurSV.value = safeClipDur;
    ppsSV.value = pxPerSec;
    stripWSV.value = stripW;
  }, [dur, safeClipDur, pxPerSec, stripW, durSV, clipDurSV, ppsSV, stripWSV]);

  // Clamp the start and (re)publish the range whenever geometry/clip changes.
  useEffect(() => {
    if (!dur) return;
    const maxStart = Math.max(0, dur - safeClipDur);
    const clamped = Math.min(clipStartRef.current, maxStart);
    clipStartRef.current = clamped;
    startSV.value = clamped;
    if (!player.playing) playheadSV.value = clamped;
    onRangeChange({ start: clamped, end: Math.min(clamped + safeClipDur, dur) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeClipDur, dur]);

  function pauseIfPlaying() {
    if (player.playing) player.pause();
  }

  function commitStart(next: number, seek: "now" | "throttled") {
    const maxStart = Math.max(0, dur - safeClipDur);
    const clamped = Math.max(0, Math.min(maxStart, next));
    clipStartRef.current = clamped;
    if (seek === "now") seekNow(clamped);
    else seekThrottled(clamped);
    onRangeChange({ start: clamped, end: Math.min(clamped + safeClipDur, dur) });
    return clamped;
  }

  function endDrag(rawStart: number) {
    commitStart(rawStart, "now");
  }

  const blockPan = Gesture.Pan()
    .activeOffsetX([-2, 2])
    .failOffsetY([-15, 15])
    .onBegin(() => {
      "worklet";
      startSaved.value = startSV.value;
      scheduleOnRN(pauseIfPlaying);
    })
    .onUpdate((e) => {
      "worklet";
      const maxStart = Math.max(0, durSV.value - clipDurSV.value);
      const delta = ppsSV.value > 0 ? e.translationX / ppsSV.value : 0;
      const clamped = Math.max(0, Math.min(maxStart, startSaved.value + delta));
      startSV.value = clamped;
      playheadSV.value = clamped; // needle glued to the box's left edge while dragging
    })
    .onEnd(() => {
      "worklet";
      scheduleOnRN(endDrag, startSV.value);
    });

  function scrollToStart(start: number, animated: boolean) {
    if (!scrollEnabled) return;
    const x = start * pxPerSec - viewportW * 0.3;
    scrollRef.current?.scrollTo({ x: Math.max(0, x), animated });
  }

  function applyClipDuration(seconds: number) {
    const clamped = Math.max(0.5, Math.min(seconds, dur));
    setClipDuration(clamped);
    const maxStart = Math.max(0, dur - clamped);
    const clampedStart = Math.min(clipStartRef.current, maxStart);
    clipStartRef.current = clampedStart;
    startSV.value = clampedStart;
    if (!player.playing) playheadSV.value = clampedStart;
    onRangeChange({ start: clampedStart, end: Math.min(clampedStart + clamped, dur) });
  }

  function stepBlock(direction: number, amount: number = NUDGE_STEP) {
    if (player.playing) player.pause();
    const next = commitStart(clipStartRef.current + direction * amount, "throttled");
    startSV.value = next;
    playheadSV.value = next;
    scrollToStart(next, false);
  }

  // All styles are derived from startSV / playheadSV on the UI thread.
  const blockStyle = useAnimatedStyle(() => ({
    left: startSV.value * ppsSV.value,
    width: clipDurSV.value * ppsSV.value,
  }));
  const dimLeftStyle = useAnimatedStyle(() => ({
    left: 0,
    width: Math.max(0, startSV.value * ppsSV.value),
  }));
  const dimRightStyle = useAnimatedStyle(() => {
    const right = (startSV.value + clipDurSV.value) * ppsSV.value;
    return { left: right, width: Math.max(0, stripWSV.value - right) };
  });
  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: playheadSV.value * ppsSV.value }],
  }));

  return {
    safeClipDur,
    stripW,
    scrollEnabled,
    blockPan,
    applyClipDuration,
    stepBlock,
    clipStartRef,
    blockStyle,
    dimLeftStyle,
    dimRightStyle,
    needleStyle,
  };
}
