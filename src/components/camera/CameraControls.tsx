import { CameraMode } from "expo-camera";
import { useRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing, fontSize } from "../../theme";

const LONG_PRESS_DELAY = 300; // ms before hold-to-record kicks in

type Props = {
  mode: CameraMode;
  isRecording: boolean;
  isHoldRecording: boolean;
  recordingDuration: number;
  isBusy: boolean;
  onModeChange: (mode: CameraMode) => void;
  onCapture: () => void;
  onLongPressCapture: () => void;
  onReleaseCapture: () => void;
  onGallery: () => void;
  onFlip: () => void;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CameraControls({
  mode,
  isRecording,
  isHoldRecording,
  recordingDuration,
  isBusy,
  onModeChange,
  onCapture,
  onLongPressCapture,
  onReleaseCapture,
  onGallery,
  onFlip,
}: Props) {
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // tracks what the current press gesture means
  const pressStateRef = useRef<"idle" | "pending" | "holding" | "video-tap">("idle");

  function handlePressIn() {
    if (isBusy) return;

    if (isRecording && !isHoldRecording) {
      // video mode — will stop on release
      pressStateRef.current = "video-tap";
      return;
    }

    if (!isRecording) {
      pressStateRef.current = "pending";
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        pressStateRef.current = "holding";
        onLongPressCapture();
      }, LONG_PRESS_DELAY);
    }
  }

  function handlePressOut() {
    const state = pressStateRef.current;
    pressStateRef.current = "idle";

    if (state === "pending") {
      clearTimeout(holdTimerRef.current!);
      holdTimerRef.current = null;
      onCapture(); // short tap
    } else if (state === "holding") {
      onReleaseCapture(); // end hold recording
    } else if (state === "video-tap") {
      onCapture(); // stop video mode recording
    }
  }

  return (
    <View style={s.panel}>
      {/* Top row: mode toggle OR recording indicator */}
      {isRecording ? (
        <View style={s.recordingRow}>
          <View style={s.recDot} />
          <Text style={t.durationText}>{formatDuration(recordingDuration)}</Text>
          <Text style={t.recordingLabel}>Recording</Text>
        </View>
      ) : (
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
      )}

      {/* Controls row */}
      <View style={s.controls}>
        {/* Gallery — hidden while recording */}
        <View style={s.sideBtn}>
          {!isRecording && (
            <TouchableOpacity style={s.sideBtn} onPress={onGallery}>
              <Text style={t.sideBtnIcon}>⊞</Text>
              <Text style={t.sideBtnLabel}>Gallery</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Capture button */}
        <Pressable
          style={[
            s.captureRing,
            (mode === "video" || isRecording) && s.captureRingVideo,
            isRecording && s.captureRingRecording,
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isBusy}
        >
          {isBusy ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View
              style={[
                s.captureInner,
                (mode === "video" || isHoldRecording) && s.captureInnerVideo,
                isRecording && s.captureInnerStop,
              ]}
            />
          )}
        </Pressable>

        {/* Flip — hidden while recording */}
        <View style={s.sideBtn}>
          {!isRecording && (
            <TouchableOpacity style={s.sideBtn} onPress={onFlip}>
              <Text style={t.sideBtnIcon}>↺</Text>
              <Text style={t.sideBtnLabel}>Flip</Text>
            </TouchableOpacity>
          )}
        </View>
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
  recordingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    height: 36,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
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
  durationText: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  recordingLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.textSecondary,
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
