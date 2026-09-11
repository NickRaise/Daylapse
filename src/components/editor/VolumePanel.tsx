import { useEffect, useState } from "react";
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

export function VolumePanel({ volume, onVolumeChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthSV = useSharedValue(0);
  const volumeSV = useSharedValue(volume);

  useEffect(() => {
    volumeSV.value = volume; // stay in sync when volume changes from outside a drag (e.g. the mute tap)
  }, [volume, volumeSV]);

  function handleLayout(e: { nativeEvent: { layout: { width: number } } }) {
    setTrackWidth(e.nativeEvent.layout.width);
    trackWidthSV.value = e.nativeEvent.layout.width;
  }

  // Position is driven straight on the UI thread — no JS round trip per frame — so dragging tracks the finger exactly.
  const pan = Gesture.Pan()
    .activeOffsetX([-2, 2])
    .failOffsetY([-10, 10])
    .onBegin((e) => {
      "worklet";
      const v = Math.max(0, Math.min(1, e.x / (trackWidthSV.value || 1)));
      volumeSV.value = v;
      scheduleOnRN(onVolumeChange, v);
    })
    .onUpdate((e) => {
      "worklet";
      const v = Math.max(0, Math.min(1, e.x / (trackWidthSV.value || 1)));
      volumeSV.value = v;
      scheduleOnRN(onVolumeChange, v);
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
