import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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
  const trackWidthRef = useRef(0);
  trackWidthRef.current = trackWidth;

  const fillWidth = volume * trackWidth;
  const thumbLeft = fillWidth - THUMB / 2;

  function clamp(x: number) {
    const w = trackWidthRef.current || 1;
    return Math.max(0, Math.min(1, x / w));
  }

  // Gesture handler, not the raw responder system — that was getting stolen
  // by the parent ScrollView, making the slider laggy and jump positions.
  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-2, 2])
    .failOffsetY([-10, 10])
    .onBegin((e) => onVolumeChange(clamp(e.x)))
    .onUpdate((e) => onVolumeChange(clamp(e.x)));

  const icon =
    volume === 0 ? "volume-xmark" : volume < 0.5 ? "volume-low" : "volume-high";

  return (
    <View style={s.root}>
      <Text style={s.subLabel}>Volume</Text>

      <View style={s.row}>
        <FontAwesomeFreeSolid name={icon} size={16} color={colors.textMuted} />

        <GestureDetector gesture={pan}>
          <View
            style={s.hitArea}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          >
            <View style={s.rail} />
            <View style={[s.fill, { width: Math.max(0, fillWidth) }]} />
            {trackWidth > 0 && (
              <View style={[s.thumb, { left: thumbLeft }]} />
            )}
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
