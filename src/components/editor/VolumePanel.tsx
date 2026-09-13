import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, fontSize, spacing } from "@/theme";

type Props = {
  volume: number; // 0–1
  onVolumeChange: (v: number) => void;
};

const THUMB = 20;
const RAIL_H = 4;
const HIT_H = 36;
const COMMIT_THROTTLE_MS = 80;

export function VolumePanel({ volume, onVolumeChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthSV = useSharedValue(0);
  const volumeSV = useSharedValue(volume);

  const throttleRef = useRef<{
    last: number;
    timer: ReturnType<typeof setTimeout> | null;
    pending: number | null;
  }>({ last: 0, timer: null, pending: null });

  useEffect(() => {
    volumeSV.value = volume; // stay in sync when volume changes from outside a drag (e.g. the mute tap)
  }, [volume, volumeSV]);

  useEffect(() => {
    return () => {
      if (throttleRef.current.timer) clearTimeout(throttleRef.current.timer);
    };
  }, []);

  // Leading+trailing throttle (mirrors useClipTrim's seekThrottled) so a drag doesn't re-render the whole editor tree every touch-move frame.
  function commitVolume(v: number) {
    const st = throttleRef.current;
    const elapsed = Date.now() - st.last;
    if (elapsed >= COMMIT_THROTTLE_MS) {
      if (st.timer) { clearTimeout(st.timer); st.timer = null; }
      st.pending = null;
      st.last = Date.now();
      onVolumeChange(v);
      return;
    }
    st.pending = v;
    if (!st.timer) {
      st.timer = setTimeout(() => {
        st.timer = null;
        if (st.pending != null) {
          st.last = Date.now();
          onVolumeChange(st.pending);
          st.pending = null;
        }
      }, COMMIT_THROTTLE_MS - elapsed);
    }
  }

  function handleLayout(e: { nativeEvent: { layout: { width: number } } }) {
    setTrackWidth(e.nativeEvent.layout.width);
    trackWidthSV.value = e.nativeEvent.layout.width;
  }

  // Visual position is driven straight on the UI thread every frame; only the JS-side commit (audio volume, % label) is throttled.
  const pan = Gesture.Pan()
    .activeOffsetX([-2, 2])
    .failOffsetY([-10, 10])
    .onBegin((e) => {
      "worklet";
      const v = Math.max(0, Math.min(1, e.x / (trackWidthSV.value || 1)));
      volumeSV.value = v;
      scheduleOnRN(commitVolume, v);
    })
    .onUpdate((e) => {
      "worklet";
      const v = Math.max(0, Math.min(1, e.x / (trackWidthSV.value || 1)));
      volumeSV.value = v;
      scheduleOnRN(commitVolume, v);
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(0, volumeSV.value * trackWidthSV.value),
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    left: volumeSV.value * trackWidthSV.value - THUMB / 2,
  }));

  const icon =
    volume === 0 ? "volume-xmark" : volume < 0.5 ? "volume-low" : "volume-high";

  return (
    <View style={s.root}>
      <Text style={s.subLabel}>Volume</Text>

      <View style={s.row}>
        <Pressable onPress={() => onVolumeChange(0)} hitSlop={8}>
          <FontAwesomeFreeSolid name={icon} size={16} color={colors.textMuted} />
        </Pressable>

        <GestureDetector gesture={pan}>
          <View style={s.hitArea} onLayout={handleLayout}>
            <View style={s.rail} />
            <Animated.View style={[s.fill, fillStyle]} />
            {trackWidth > 0 && <Animated.View style={[s.thumb, thumbStyle]} />}
          </View>
        </GestureDetector>

        <Text style={s.pct}>{Math.round(volume * 100)}%</Text>
      </View>

      <Text style={s.hint}>
        Sets the playback volume for this video clip on your day.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing[3],
  },
  subLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  hitArea: {
    flex: 1,
    height: HIT_H,
    justifyContent: "center",
  },
  rail: {
    position: "absolute",
    left: 0,
    right: 0,
    height: RAIL_H,
    borderRadius: RAIL_H / 2,
    backgroundColor: colors.border,
  },
  fill: {
    position: "absolute",
    left: 0,
    height: RAIL_H,
    borderRadius: RAIL_H / 2,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    top: (HIT_H - THUMB) / 2,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  pct: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
    minWidth: 36,
    textAlign: "right",
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
    fontStyle: "italic",
  },
});
