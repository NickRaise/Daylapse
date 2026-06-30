import { CameraView, CameraType, CameraMode } from "expo-camera";
import { RefObject } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing, fontSize } from "../../theme";

type Props = {
  cameraRef: RefObject<CameraView | null>;
  facing: CameraType;
  mode: CameraMode;
  isRecording: boolean;
  onClose: () => void;
  onOpenNativeCamera: () => void;
};

export function CameraViewfinder({
  cameraRef,
  facing,
  mode,
  isRecording,
  onClose,
  onOpenNativeCamera,
}: Props) {
  return (
    <View style={s.wrapper}>
      <CameraView ref={cameraRef} style={s.camera} facing={facing} mode={mode} />

      {isRecording ? (
        <View style={s.recBadge}>
          <View style={s.recDot} />
          <Text style={t.recText}>REC</Text>
        </View>
      ) : (
        <TouchableOpacity style={s.nativeBtn} onPress={onOpenNativeCamera}>
          <Text style={t.nativeBtnIcon}>⊙</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={s.closeBtn} onPress={onClose}>
        <Text style={t.closeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: "hidden",
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  camera: {
    flex: 1,
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
  nativeBtn: {
    position: "absolute",
    top: spacing[6],
    right: spacing[5],
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
});

const t = StyleSheet.create({
  closeBtnText: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  nativeBtnIcon: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  recText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.error,
    letterSpacing: 1,
  },
});
