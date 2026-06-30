import {
  CameraView,
  CameraType,
  CameraMode,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
// TODO (dev build): switch to "expo-media-library" (non-legacy) and replace createAssetAsync → Asset.create()
import * as MediaLibrary from "expo-media-library/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, radius, spacing, fontSize } from "../../theme";

type Preview = { uri: string; type: "photo" | "video" };

export default function Camera() {
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const [facing, setFacing] = useState<CameraType>("back");
  const [mode, setMode] = useState<CameraMode>("picture");
  const [isRecording, setIsRecording] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // ── Permission gates ──────────────────────────────────────────────────────

  if (!camPermission) return <View style={vs.root} />;

  if (!camPermission.granted) {
    return (
      <View style={vs.permContainer}>
        <Text style={ts.permTitle}>Camera access needed</Text>
        <Button onPress={requestCamPermission} title="Grant camera permission" />
      </View>
    );
  }

  // ── Capture handlers ──────────────────────────────────────────────────────

  async function handleCapture() {
    if (!cameraRef.current || isBusy) return;

    if (mode === "picture") {
      setIsBusy(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
        setPreview({ uri: photo.uri, type: "photo" });
      } finally {
        setIsBusy(false);
      }
      return;
    }

    // Video mode
    if (isRecording) {
      cameraRef.current.stopRecording();
      return;
    }

    if (!micPermission?.granted) {
      await requestMicPermission();
      return;
    }

    setIsRecording(true);
    try {
      const result = await cameraRef.current.recordAsync();
      if (result?.uri) setPreview({ uri: result.uri, type: "video" });
    } finally {
      setIsRecording(false);
    }
  }

  async function savePreview() {
    if (!preview) return;
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status !== "granted") return;
    await MediaLibrary.createAssetAsync(preview.uri);
    setPreview(null);
  }

  async function openGallery() {
    await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"] });
  }

  // ── Preview overlay ───────────────────────────────────────────────────────

  if (preview) {
    return (
      <View style={vs.root}>
        <View style={vs.viewfinderWrapper}>
          {preview.type === "photo" ? (
            <Image source={{ uri: preview.uri }} style={vs.camera} resizeMode="cover" />
          ) : (
            <View style={[vs.camera, vs.videoPlaceholder]}>
              <Text style={ts.videoIcon}>▶</Text>
              <Text style={ts.videoSavedText}>Video recorded</Text>
            </View>
          )}
        </View>

        <View style={vs.panel}>
          <View style={vs.previewActions}>
            <TouchableOpacity
              style={[vs.previewBtn, vs.previewBtnSecondary]}
              onPress={() => setPreview(null)}
            >
              <Text style={ts.previewBtnTextSecondary}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[vs.previewBtn, vs.previewBtnPrimary]} onPress={savePreview}>
              <Text style={ts.previewBtnTextPrimary}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Main camera UI ────────────────────────────────────────────────────────

  return (
    <View style={vs.root}>
      <View style={vs.viewfinderWrapper}>
        <CameraView ref={cameraRef} style={vs.camera} facing={facing} mode={mode} />

        {/* Recording indicator */}
        {isRecording && (
          <View style={vs.recBadge}>
            <View style={vs.recDot} />
            <Text style={ts.recText}>REC</Text>
          </View>
        )}

        {/* Close */}
        <TouchableOpacity style={vs.closeBtn} onPress={() => router.back()}>
          <Text style={ts.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom panel */}
      <View style={vs.panel}>
        {/* Mode toggle */}
        <View style={vs.modeRow}>
          <TouchableOpacity
            style={[vs.modeChip, mode === "picture" && vs.modeChipActive]}
            onPress={() => { setMode("picture"); setIsRecording(false); }}
          >
            <Text style={[ts.modeChipText, mode === "picture" && ts.modeChipTextActive]}>
              Photo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[vs.modeChip, mode === "video" && vs.modeChipActive]}
            onPress={() => setMode("video")}
          >
            <Text style={[ts.modeChipText, mode === "video" && ts.modeChipTextActive]}>
              Video
            </Text>
          </TouchableOpacity>
        </View>

        {/* Controls */}
        <View style={vs.controls}>
          {/* Gallery */}
          <TouchableOpacity style={vs.sideBtn} onPress={openGallery}>
            <Text style={ts.sideBtnIcon}>⊞</Text>
            <Text style={ts.sideBtnLabel}>Gallery</Text>
          </TouchableOpacity>

          {/* Capture */}
          <TouchableOpacity
            style={[
              vs.captureRing,
              mode === "video" && vs.captureRingVideo,
              isRecording && vs.captureRingRecording,
            ]}
            onPress={handleCapture}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View
                style={[
                  vs.captureInner,
                  mode === "video" && vs.captureInnerVideo,
                  isRecording && vs.captureInnerStop,
                ]}
              />
            )}
          </TouchableOpacity>

          {/* Flip */}
          <TouchableOpacity
            style={vs.sideBtn}
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
            disabled={isRecording}
          >
            <Text style={[ts.sideBtnIcon, isRecording && ts.sideBtnDisabled]}>↺</Text>
            <Text style={[ts.sideBtnLabel, isRecording && ts.sideBtnDisabled]}>Flip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── View styles ──────────────────────────────────────────────────────────────

const vs = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  permContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
    gap: spacing[4],
  },
  viewfinderWrapper: {
    flex: 1,
    overflow: "hidden",
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  camera: {
    flex: 1,
  },
  videoPlaceholder: {
    backgroundColor: colors.textPrimary,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[3],
  },
  closeBtn: {
    position: "absolute",
    top: spacing[6],
    left: spacing[5],
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: "rgba(254,250,224,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  recBadge: {
    position: "absolute",
    top: spacing[6],
    right: spacing[5],
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    gap: spacing[2],
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
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
  previewActions: {
    flexDirection: "row",
    gap: spacing[4],
  },
  previewBtn: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    alignItems: "center",
  },
  previewBtnSecondary: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewBtnPrimary: {
    backgroundColor: colors.primary,
  },
});

// ── Text styles ──────────────────────────────────────────────────────────────

const ts = StyleSheet.create({
  permTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  closeBtnText: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  recText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.error,
    letterSpacing: 1,
  },
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
  videoIcon: {
    fontSize: 48,
    color: colors.bg,
  },
  videoSavedText: {
    fontSize: fontSize.base,
    color: colors.bgSubtle,
    fontWeight: "500",
  },
  previewBtnTextSecondary: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  previewBtnTextPrimary: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.textOnAccent,
  },
});
