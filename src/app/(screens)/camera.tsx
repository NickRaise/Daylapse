import { CameraView, CameraType, CameraMode } from "expo-camera";
// TODO (dev build): switch to "expo-media-library" (non-legacy) and replace createAssetAsync → Asset.create()
import * as MediaLibrary from "expo-media-library/legacy";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { CameraPermission } from "../../components/camera/CameraPermission";
import { CameraViewfinder } from "../../components/camera/CameraViewfinder";
import { CameraControls } from "../../components/camera/CameraControls";
import { CameraPreview } from "../../components/camera/CameraPreview";
import useMediaStore from "@/store/media.store";
import useEntryStore from "@/store/entry.store";
import useSettingsStore from "@/store/settings.store";
import { MediaRepository } from "@/repositories/media.repository";
import { mediaService } from "@/service/media.service";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import { useRecordingTimer } from "@/hooks/useRecordingTimer";
import { useCameraReady } from "@/hooks/useCameraReady";

type Preview = { uri: string; type: "photo" | "video"; isLoading?: boolean };

const PHOTO_QUALITY = { low: 0.5, medium: 0.75, high: 0.9 } as const;

export default function Camera() {
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const isHoldRecordingRef = useRef(false); // sync ref — avoids stale closure in handleReleaseCapture
  const setRecentlySavedMediaURI = useMediaStore(
    (state) => state.setRecentlySavedMediaURI,
  );
  const currentEntryId = useEntryStore((state) => state.currentId);
  const saveToGallery = useSettingsStore((state) => state.saveToGallery);
  const videoQuality = useSettingsStore((state) => state.videoQuality);
  const useNativeCamera = useSettingsStore((state) => state.useNativeCamera);
  const recordingTimeLimit = useSettingsStore((state) => state.recordingTimeLimit);

  const nativeCameraLaunchedRef = useRef(false);

  const [facing, setFacing] = useState<CameraType>("back");
  const [mode, setMode] = useState<CameraMode>("picture"); // UI toggle
  const [cameraMode, setCameraMode] = useState<CameraMode>("picture"); // actual CameraView mode
  const [isRecording, setIsRecording] = useState(false);
  const [isHoldRecording, setIsHoldRecording] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  const { loading, granted, request } = useMediaPermissions();
  const { duration: recordingDuration, startTimer, stopTimer } = useRecordingTimer();
  const { waitForCameraReady, handleCameraReady } = useCameraReady();

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
      if (asset) setPreview({ uri: asset.uri, type: asset.type === "video" ? "video" : "photo" });
    });
  }, [granted, useNativeCamera]);

  if (loading) return <View style={s.root} />;
  if (!granted) return <CameraPermission onRequest={request} />;

  // ── Capture handlers ──────────────────────────────────────────────────────

  async function handleCapture() {
    if (!cameraRef.current || isBusy || isHoldRecording) return;

    if (mode === "picture") {
      setIsBusy(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: PHOTO_QUALITY[videoQuality] });
        setPreview({ uri: photo.uri, type: "photo" });
      } finally {
        setIsBusy(false);
      }
      return;
    }

    // Video mode — tap to toggle
    if (isRecording) {
      setIsRecording(false);
      stopTimer();
      setPreview({ uri: "", type: "video", isLoading: true });
      cameraRef.current.stopRecording();
      return;
    }
    setIsRecording(true);
    startTimer();
    try {
      const result = await cameraRef.current.recordAsync(recordingTimeLimit ? { maxDuration: recordingTimeLimit } : undefined);
      setPreview(result?.uri ? { uri: result.uri, type: "video", isLoading: false } : null);
    } catch {
      setPreview(null);
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
      const result = await cameraRef.current.recordAsync(recordingTimeLimit ? { maxDuration: recordingTimeLimit } : undefined);
      setPreview(result?.uri ? { uri: result.uri, type: "video", isLoading: false } : null);
    } catch {
      setPreview(null);
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
    setPreview({ uri: "", type: "video", isLoading: true });
    cameraRef.current?.stopRecording();
  }

  // ── Preview handlers ──────────────────────────────────────────────────────

  async function handleSave() {
    if (!preview) return;
    try {
      const localUri = await mediaService.copyMedia(preview.uri);
      if (saveToGallery) await MediaLibrary.createAssetAsync(preview.uri);

      if (currentEntryId !== null) {
        const existingMedia = await MediaRepository.getMediaByEntry(currentEntryId);
        await MediaRepository.addMedia({
          entryId: currentEntryId,
          type: preview.type === "photo" ? "image" : "video",
          uri: localUri,
          order: existingMedia.length,
        });
      }

      setPreview(null);
      setRecentlySavedMediaURI(localUri);
    } catch (error) {
      console.error("[camera] save failed:", error);
    }
    router.back();
  }

  async function handleGallery() {
    await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"] });
  }

  async function handleNativeCamera() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: mode === "picture" ? ["images"] : ["videos"],
      quality: PHOTO_QUALITY[videoQuality],
      videoMaxDuration: recordingTimeLimit ?? 300,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPreview({ uri: asset.uri, type: asset.type === "video" ? "video" : "photo" });
    }
  }

  function handleModeChange(next: CameraMode) {
    if (isRecording) return;
    setMode(next);
    setCameraMode(next);
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
