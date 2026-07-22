import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, fontSize, spacing } from "@/theme";
import { fmt } from "@/utils/time";

type Props = {
  isPlaying: boolean;
  playhead: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
};

export function TrimControls({
  isPlaying,
  playhead,
  duration,
  onPlay,
  onPause,
  onStepBack,
  onStepForward,
}: Props) {
  return (
    <View style={s.controls}>
      <View style={s.controlsSide} />

      <View style={s.btnGroup}>
        <Pressable style={s.stepBtn} hitSlop={12} onPress={onStepBack}>
          <FontAwesomeFreeSolid name="backward-step" size={13} color={colors.textSecondary} />
        </Pressable>

        <Pressable style={s.playBtn} hitSlop={8} onPress={isPlaying ? onPause : onPlay}>
          <FontAwesomeFreeSolid
            name={isPlaying ? "pause" : "play"}
            size={15}
            color={colors.textOnAccent}
          />
        </Pressable>

        <Pressable style={s.stepBtn} hitSlop={12} onPress={onStepForward}>
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
  );
}

const s = StyleSheet.create({
  controls: { flexDirection: "row", alignItems: "center" },
  controlsSide: { flex: 1, justifyContent: "center", alignItems: "flex-end" },
  btnGroup: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
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
});
