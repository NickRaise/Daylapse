import { Camera, type CameraDevice, type CameraDeviceFormat } from "react-native-vision-camera";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { RefObject } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { fontSize, makeStyles, radius, spacing, useColors } from "../../theme";

type Props = {
  cameraRef: RefObject<Camera | null>;
  device: CameraDevice | undefined;
  format: CameraDeviceFormat | undefined;
  fps: number;
  isActive: boolean;
  isRecording: boolean;
  onInitialized: () => void;
  onClose: () => void;
  onOpenNativeCamera: () => void;
};

export function CameraViewfinder({
  cameraRef,
  device,
  format,
  fps,
  isActive,
  isRecording,
  onInitialized,
  onClose,
  onOpenNativeCamera,
}: Props) {
  const s = useStyles();
  const t = useTextStyles();
  const colors = useColors();
  // Formats report landscape-native sensor dimensions, but this app shoots portrait — invert so the preview box matches the actual recorded aspect ratio instead of just filling the screen and cropping to whatever shape that happens to be.
  const previewAspectRatio = format ? format.videoHeight / format.videoWidth : undefined;
  return (
    <View style={s.wrapper}>
      {device && (
        <View style={[s.cameraBox, previewAspectRatio ? { aspectRatio: previewAspectRatio } : { flex: 1 }]}>
          <Camera
            ref={cameraRef}
            style={s.camera}
            device={device}
            isActive={isActive}
            photo
            video
            audio
            format={format}
            fps={fps}
            onInitialized={onInitialized}
          />
        </View>
      )}

      {isRecording ? (
        <View style={s.recBadge}>
          <View style={s.recDot} />
          <Text style={t.recText}>REC</Text>
        </View>
      ) : (
        <TouchableOpacity style={s.nativeBtn} onPress={onOpenNativeCamera} hitSlop={12}>
          <FontAwesomeFreeSolid name="camera" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      )}

      <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={12}>
        <Text style={t.closeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    backgroundColor: "#000",
  },
  cameraBox: {
    height: "100%",
  },
  camera: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    bottom: spacing[6],
    left: spacing[5],
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
}));

const useTextStyles = makeStyles((colors) => ({
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
}));
