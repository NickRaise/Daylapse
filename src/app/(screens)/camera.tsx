import { CameraView, CameraType, CameraMode, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
// TODO (dev build): switch to "expo-media-library" (non-legacy) and replace createAssetAsync → Asset.create()
import * as MediaLibrary from "expo-media-library/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { CameraPermission } from "../../components/camera/CameraPermission";
import { CameraViewfinder } from "../../components/camera/CameraViewfinder";
import { CameraControls } from "../../components/camera/CameraControls";
import { CameraPreview } from "../../components/camera/CameraPreview";

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

  if (!camPermission) return <View style={s.root} />;

  if (!camPermission.granted) {
    return <CameraPermission onRequest={requestCamPermission} />;
  }

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

  async function handleSave() {
    if (!preview) return;
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status !== "granted") return;
    await MediaLibrary.createAssetAsync(preview.uri);
    setPreview(null);
  }

  async function handleGallery() {
    await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"] });
  }

  async function handleNativeCamera() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: mode === "picture" ? ["images"] : ["videos"],
      quality: 1,
      videoMaxDuration: 300,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPreview({ uri: asset.uri, type: asset.type === "video" ? "video" : "photo" });
    }
  }

  function handleModeChange(next: CameraMode) {
    setMode(next);
    setIsRecording(false);
  }

  if (preview) {
    return (
      <CameraPreview
        preview={preview}
        onRetake={() => setPreview(null)}
        onSave={handleSave}
      />
    );
  }

  return (
    <View style={s.root}>
      <CameraViewfinder
        cameraRef={cameraRef}
        facing={facing}
        mode={mode}
        isRecording={isRecording}
        onClose={() => router.back()}
        onOpenNativeCamera={handleNativeCamera}
      />
      <CameraControls
        mode={mode}
        isRecording={isRecording}
        isBusy={isBusy}
        onModeChange={handleModeChange}
        onCapture={handleCapture}
        onGallery={handleGallery}
        onFlip={() => setFacing((f) => (f === "back" ? "front" : "back"))}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
