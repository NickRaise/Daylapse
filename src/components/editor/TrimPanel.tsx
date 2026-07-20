import { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, fontSize, radius, spacing } from "@/theme";

export type TrimRange = { start: number; end: number };

type Props = {
  duration: number; // total video duration in seconds
  range: TrimRange;
  onRangeChange: (range: TrimRange) => void;
};

const PRESETS = [
  { label: "Full", value: null },
  { label: "1s", value: 1 },
  { label: "3s", value: 3 },
  { label: "5s", value: 5 },
  { label: "10s", value: 10 },
];

const THUMB = 22;
const RAIL_H = 5;
const HIT = 36;

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function TrimPanel({ duration, range, onRangeChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackOriginX = useRef(0);
  const [customSec, setCustomSec] = useState("");
  const [activePreset, setActivePreset] = useState<number | null | "custom">(null);

  const safeEnd = range.end > 0 ? range.end : duration;
  const startRatio = duration > 0 ? range.start / duration : 0;
  const endRatio = duration > 0 ? safeEnd / duration : 1;

  function applyPreset(secs: number | null) {
    if (secs === null) {
      onRangeChange({ start: 0, end: duration });
    } else {
      const clippedEnd = Math.min(range.start + secs, duration);
      onRangeChange({ start: range.start, end: clippedEnd });
    }
    setActivePreset(secs);
    setCustomSec("");
  }

  function applyCustom() {
    const val = parseFloat(customSec);
    if (isNaN(val) || val <= 0) return;
    const clippedEnd = Math.min(range.start + val, duration);
    onRangeChange({ start: range.start, end: clippedEnd });
    setActivePreset("custom");
  }

  function clampRatio(x: number) {
    return Math.max(0, Math.min(1, x / (trackWidth || 1)));
  }

  const startLeft = startRatio * trackWidth - THUMB / 2;
  const endLeft = endRatio * trackWidth - THUMB / 2;

  return (
    <View style={s.root}>
      {/* Duration presets */}
      <Text style={s.subLabel}>Duration</Text>
      <View style={s.presets}>
        {PRESETS.map(({ label, value }) => {
          const isActive = activePreset === value;
          return (
            <Pressable
              key={label}
              style={[s.pill, isActive && s.pillActive]}
              onPress={() => applyPreset(value)}
            >
              <Text style={[s.pillText, isActive && s.pillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}

        {/* Custom input */}
        <View style={[s.customWrap, activePreset === "custom" && s.pillActive]}>
          <TextInput
            style={[s.customInput, activePreset === "custom" && s.customInputActive]}
            value={customSec}
            onChangeText={setCustomSec}
            placeholder="…s"
            placeholderTextColor={colors.placeholderSecondary}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={applyCustom}
            maxLength={5}
          />
        </View>
      </View>

      {/* Timeline */}
      <Text style={s.subLabel}>Clip range</Text>
      <View style={s.timeRow}>
        <Text style={s.timeLabel}>{formatTime(range.start)}</Text>
        <Text style={s.timeLabel}>{formatTime(safeEnd)}</Text>
      </View>

      <View
        style={s.trackHitArea}
        onLayout={(e) => {
          setTrackWidth(e.nativeEvent.layout.width);
        }}
      >
        {/* Rail */}
        <View style={s.rail} />
        {/* Selected range fill */}
        <View
          style={[
            s.fill,
            {
              left: startRatio * trackWidth,
              width: Math.max(0, (endRatio - startRatio) * trackWidth),
            },
          ]}
        />

        {/* Start handle */}
        {trackWidth > 0 && (
          <View
            style={[s.thumbHit, { left: startLeft + THUMB / 2 - HIT / 2 }]}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              trackOriginX.current = e.nativeEvent.pageX - e.nativeEvent.locationX - (startLeft + THUMB / 2 - HIT / 2);
            }}
            onResponderMove={(e) => {
              const ratio = clampRatio(e.nativeEvent.pageX - trackOriginX.current);
              const newStart = Math.min(ratio * duration, safeEnd - 0.5);
              onRangeChange({ start: newStart, end: safeEnd });
            }}
          >
            <View style={[s.thumb, s.thumbStart]} />
          </View>
        )}

        {/* End handle */}
        {trackWidth > 0 && (
          <View
            style={[s.thumbHit, { left: endLeft + THUMB / 2 - HIT / 2 }]}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              trackOriginX.current = e.nativeEvent.pageX - e.nativeEvent.locationX - (endLeft + THUMB / 2 - HIT / 2);
            }}
            onResponderMove={(e) => {
              const ratio = clampRatio(e.nativeEvent.pageX - trackOriginX.current);
              const newEnd = Math.max(ratio * duration, range.start + 0.5);
              onRangeChange({ start: range.start, end: newEnd });
            }}
          >
            <View style={[s.thumb, s.thumbEnd]} />
          </View>
        )}
      </View>

      <Text style={s.hint}>
        Drag handles to select the clip range. The selected portion plays on your day.
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
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    alignItems: "center",
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
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
  customWrap: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: 14,
    paddingVertical: 4,
    minWidth: 52,
    alignItems: "center",
  },
  customInput: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.textSecondary,
    padding: 0,
    minWidth: 32,
    textAlign: "center",
  },
  customInputActive: {
    color: colors.textOnAccent,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontVariant: ["tabular-nums"],
  },
  trackHitArea: {
    height: HIT,
    justifyContent: "center",
    marginHorizontal: THUMB / 2,
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
    height: RAIL_H,
    borderRadius: RAIL_H / 2,
    backgroundColor: colors.primary,
  },
  thumbHit: {
    position: "absolute",
    width: HIT,
    height: HIT,
    justifyContent: "center",
    alignItems: "center",
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  thumbStart: {},
  thumbEnd: {},
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
    fontStyle: "italic",
  },
});
