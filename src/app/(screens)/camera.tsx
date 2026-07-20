import { CameraView, CameraType, CameraMode } from "expo-camera";
// TODO (dev build): switch to "expo-media-library" (non-legacy) and replace createAssetAsync → Asset.create()
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { colors } from "../../theme";
import { CameraPermission } from "../../components/camera/CameraPermission";
import { CameraViewfinder } from "../../components/camera/CameraViewfinder";
import { CameraControls } from "../../components/camera/CameraControls";
import useEditorStore from "@/store/editor.store";
import useSettingsStore from "@/store/settings.store";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import { useRecordingTimer } from "@/hooks/useRecordingTimer";
import { useCameraReady } from "@/hooks/useCameraReady";

const PHOTO_QUALITY = { low: 0.5, medium: 0.75, high: 0.9 } as const;

export default function Camera() {
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const isHoldRecordingRef = useRef(false);
  const sentToEditorRef = useRef(false); // tracks that we navigated to editor

  const setPendingMedia = useEditorStore((s) => s.setPendingMedia);
  const pendingMedia = useEditorStore((s) => s.pendingMedia);

  const videoQuality = useSettingsStore((state) => state.videoQuality);
  const useNativeCamera = useSettingsStore((state) => state.useNativeCamera);
  const recordingTimeLimit = useSettingsStore((state) => state.recordingTimeLimit);

  const nativeCameraLaunchedRef = useRef(false);

  const [facing, setFacing] = useState<CameraType>("back");
  const [mode, setMode] = useState<CameraMode>("picture");
  const [cameraMode, setCameraMode] = useState<CameraMode>("picture");
  const [isRecording, setIsRecording] = useState(false);
  const [isHoldRecording, setIsHoldRecording] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const { loading, granted, request } = useMediaPermissions();
  const { duration: recordingDuration, startTimer, stopTimer } = useRecordingTimer();
  const { waitForCameraReady, handleCameraReady } = useCameraReady();

  // Auto-launch native camera if setting is enabled
  useEffect(() => {
    if (!granted || !useNativeCamera || nativeCameraLaunchedRef.current) return;
    nativeCameraLaunchedRef.current = true;
    ImagePicker.launchCameraAsync({
      mediaTypes: ["images", "videos"],
      quality: PHOTO_QUALITY[videoQuality],
      videoMaxDuration: recordingTimeLimit ?? 300,
    }).then((result) => {
      if (result.canceled) { router.back(); return; }
      const asset = result.assets[0];
      if (asset) {
        sentToEditorRef.current = true;
        setPendingMedia({ uri: asset.uri, type: asset.type === "video" ? "video" : "photo" });
        router.push("/editor");
      }
    });
  }, [granted, useNativeCamera]);

  // When focus returns from editor and editor has cleared the pending media, dismiss camera too
  useFocusEffect(
    useCallback(() => {
      if (sentToEditorRef.current && !pendingMedia) {
        router.back();
      }
    }, [pendingMedia]),
  );

  if (loading) return <View style={s.root} />;
  if (!granted) return <CameraPermission onRequest={request} />;

  // ── Capture handlers ──────────────────────────────────────────────────────

  function openEditor(uri: string, type: "photo" | "video", isLoading = false) {
    sentToEditorRef.current = true;
    setPendingMedia({ uri, type, isLoading });
    router.push("/editor");
  }

  async function handleCapture() {
    if (!cameraRef.current || isBusy || isHoldRecording) return;

    if (mode === "picture") {
      setIsBusy(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: PHOTO_QUALITY[videoQuality] });
        openEditor(photo.uri, "photo");
      } finally {
        setIsBusy(false);
      }
      return;
    }

    // Video mode — tap to toggle
    if (isRecording) {
      setIsRecording(false);
      stopTimer();
      openEditor("", "video", true); // loading state while video finalizes
      cameraRef.current.stopRecording();
      return;
    }
    setIsRecording(true);
    startTimer();
    try {
      const result = await cameraRef.current.recordAsync(
        recordingTimeLimit ? { maxDuration: recordingTimeLimit } : undefined,
      );
      if (result?.uri) {
        setPendingMedia({ uri: result.uri, type: "video", isLoading: false });
      } else {
        setPendingMedia(null);
        sentToEditorRef.current = false;
      }
    } catch {
      setPendingMedia(null);
      sentToEditorRef.current = false;
    } finally {
      setIsRecording(false);
      stopTimer();
    }
  }

  async function handleLongPressCapture() {
    if (!cameraRef.current || mode !== "picture" || isHoldRecording) return;

    isHoldRecordingRef.current = true;
    setIsHoldRecording(true);
    setIsRecording(true);
    setCameraMode("video");
    await waitForCameraReady();
    startTimer();
    try {
      const result = await cameraRef.current.recordAsync(
        recordingTimeLimit ? { maxDuration: recordingTimeLimit } : undefined,
      );
      if (result?.uri) {
        setPendingMedia({ uri: result.uri, type: "video", isLoading: false });
      } else {
        setPendingMedia(null);
        sentToEditorRef.current = false;
      }
    } catch {
      setPendingMedia(null);
      sentToEditorRef.current = false;
    } finally {
      isHoldRecordingRef.current = false;
      setIsHoldRecording(false);
      setIsRecording(false);
      setCameraMode("picture");
      stopTimer();
    }
  }

  function handleReleaseCapture() {
    if (!isHoldRecordingRef.current) return;
    isHoldRecordingRef.current = false;
    setIsHoldRecording(false);
    setIsRecording(false);
    stopTimer();
    openEditor("", "video", true);
    cameraRef.current?.stopRecording();
  }

  async function handleGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"] });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      openEditor(asset.uri, asset.type === "video" ? "video" : "photo");
    }
  }

  async function handleNativeCamera() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: mode === "picture" ? ["images"] : ["videos"],
      quality: PHOTO_QUALITY[videoQuality],
      videoMaxDuration: recordingTimeLimit ?? 300,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      openEditor(asset.uri, asset.type === "video" ? "video" : "photo");
    }
  }

  function handleModeChange(next: CameraMode) {
    if (isRecording) return;
    setMode(next);
    setCameraMode(next);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <CameraViewfinder
        cameraRef={cameraRef}
        facing={facing}
        mode={cameraMode}
        isRecording={isRecording}
        onCameraReady={handleCameraReady}
        onClose={() => router.back()}
        onOpenNativeCamera={handleNativeCamera}
      />
      <CameraControls
        mode={mode}
        isRecording={isRecording}
        isHoldRecording={isHoldRecording}
        recordingDuration={recordingDuration}
        isBusy={isBusy}
        onModeChange={handleModeChange}
        onCapture={handleCapture}
        onLongPressCapture={handleLongPressCapture}
        onReleaseCapture={handleReleaseCapture}
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
