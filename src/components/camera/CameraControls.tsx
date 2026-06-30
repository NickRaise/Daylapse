import { CameraMode } from "expo-camera";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing, fontSize } from "../../theme";

type Props = {
  mode: CameraMode;
  isRecording: boolean;
  isBusy: boolean;
  onModeChange: (mode: CameraMode) => void;
  onCapture: () => void;
  onGallery: () => void;
  onFlip: () => void;
};

export function CameraControls({
  mode,
  isRecording,
  isBusy,
  onModeChange,
  onCapture,
  onGallery,
  onFlip,
}: Props) {
  return (
    <View style={s.panel}>
      {/* Mode toggle */}
      <View style={s.modeRow}>
        <TouchableOpacity
          style={[s.modeChip, mode === "picture" && s.modeChipActive]}
          onPress={() => onModeChange("picture")}
        >
          <Text style={[t.modeChipText, mode === "picture" && t.modeChipTextActive]}>Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modeChip, mode === "video" && s.modeChipActive]}
          onPress={() => onModeChange("video")}
        >
          <Text style={[t.modeChipText, mode === "video" && t.modeChipTextActive]}>Video</Text>
        </TouchableOpacity>
      </View>

      {/* Controls row */}
      <View style={s.controls}>
        <TouchableOpacity style={s.sideBtn} onPress={onGallery}>
          <Text style={t.sideBtnIcon}>⊞</Text>
          <Text style={t.sideBtnLabel}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.captureRing,
            mode === "video" && s.captureRingVideo,
            isRecording && s.captureRingRecording,
          ]}
          onPress={onCapture}
          disabled={isBusy}
        >
          {isBusy ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View
              style={[
                s.captureInner,
                mode === "video" && s.captureInnerVideo,
                isRecording && s.captureInnerStop,
              ]}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={s.sideBtn} onPress={onFlip} disabled={isRecording}>
          <Text style={[t.sideBtnIcon, isRecording && t.sideBtnDisabled]}>↺</Text>
          <Text style={[t.sideBtnLabel, isRecording && t.sideBtnDisabled]}>Flip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    backgroundColor: colors.bg,
    paddingTop: spacing[5],
    paddingBottom: spacing[10],
    paddingHorizontal: spacing[6],
    gap: spacing[5],
  },
  modeRow: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.full,
    padding: spacing[1],
    alignSelf: "center",
  },
  modeChip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[6],
    borderRadius: radius.full,
  },
  modeChipActive: {
    backgroundColor: colors.primary,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
  },
  sideBtn: {
    width: 56,
    alignItems: "center",
    gap: spacing[1],
  },
  captureRing: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  captureRingVideo: {
    borderColor: colors.error,
  },
  captureRingRecording: {
    borderColor: colors.error,
    backgroundColor: "rgba(217,122,108,0.12)",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  captureInnerVideo: {
    backgroundColor: colors.error,
    borderRadius: radius.full,
    width: 60,
    height: 60,
  },
  captureInnerStop: {
    backgroundColor: colors.error,
    borderRadius: radius.sm,
    width: 28,
    height: 28,
  },
});

const t = StyleSheet.create({
  modeChipText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  modeChipTextActive: {
    color: colors.textOnAccent,
  },
  sideBtnIcon: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  sideBtnLabel: {
    fontSize: fontSize.xs,
    fontWeight: "500",
    color: colors.textMuted,
  },
  sideBtnDisabled: {
    color: colors.textDisabled,
  },
});
