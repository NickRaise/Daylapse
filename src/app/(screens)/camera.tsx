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
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { CameraPermission } from "../../components/camera/CameraPermission";
import { CameraViewfinder } from "../../components/camera/CameraViewfinder";
import { CameraControls } from "../../components/camera/CameraControls";
import { CameraPreview } from "../../components/camera/CameraPreview";
import useMediaStore from "@/store/media.store";
import useEntryStore from "@/store/entry.store";
import { MediaRepository } from "@/repositories/media.repository";
import { mediaService } from "@/service/media.service";

type Preview = { uri: string; type: "photo" | "video"; isLoading?: boolean };

export default function Camera() {
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHoldRecordingRef = useRef(false); // sync ref — avoids stale closure in handleReleaseCapture
  const cameraReadyResolverRef = useRef<(() => void) | null>(null);
  const setRecentlySavedMediaURI = useMediaStore(
    (state) => state.setRecentlySavedMediaURI,
  );
  const currentEntryId = useEntryStore((state) => state.currentId);

  const [facing, setFacing] = useState<CameraType>("back");
  const [mode, setMode] = useState<CameraMode>("picture"); // UI toggle
  const [cameraMode, setCameraMode] = useState<CameraMode>("picture"); // actual CameraView mode
  const [isRecording, setIsRecording] = useState(false);
  const [isHoldRecording, setIsHoldRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions(
    { writeOnly: true },
  );

  if (!camPermission || !micPermission || !mediaPermission)
    return <View style={s.root} />;

  if (
    !camPermission.granted ||
    !micPermission.granted ||
    !mediaPermission.granted
  ) {
    return (
      <CameraPermission
        onRequest={async () => {
          if (!camPermission.granted) await requestCamPermission();
          if (!micPermission.granted) await requestMicPermission();
          if (!mediaPermission.granted) await requestMediaPermission();
        }}
      />
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function waitForCameraReady(): Promise<void> {
    return new Promise((resolve) => {
      cameraReadyResolverRef.current = resolve;
    });
  }

  function handleCameraReady() {
    cameraReadyResolverRef.current?.();
    cameraReadyResolverRef.current = null;
  }

  function startTimer() {
    setRecordingDuration(0);
    timerRef.current = setInterval(() => {
      setRecordingDuration((d) => d + 1);
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingDuration(0);
  }

  async function saveToGallery(uri: string): Promise<string> {
    const response = await MediaLibrary.createAssetAsync(uri);
    return response.uri;
  }

  // ── Capture handlers ──────────────────────────────────────────────────────

  async function handleCapture() {
    if (!cameraRef.current || isBusy || isHoldRecording) return;

    if (mode === "picture") {
      setIsBusy(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
        });
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
      const result = await cameraRef.current.recordAsync();
      if (result?.uri) {
        setPreview({ uri: result.uri, type: "video", isLoading: false });
      } else {
        setPreview(null);
      }
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
      const result = await cameraRef.current.recordAsync();
      if (result?.uri) {
        setPreview({ uri: result.uri, type: "video", isLoading: false });
      } else {
        setPreview(null);
      }
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
    // Snap UI back and jump to preview immediately — video will fill in when ready
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
      console.log("[camera] save started — type:", preview.type, "uri:", preview.uri);

      // Copy to app storage FIRST — on iOS createAssetAsync can move the temp
      // file into Photos, making preview.uri stale before we can copy it
      const localUri = await mediaService.copyMedia(preview.uri);
      console.log("[camera] copied to local storage:", localUri);

      await saveToGallery(preview.uri);
      console.log("[camera] saved to device gallery");

      if (currentEntryId !== null) {
        const existingMedia = await MediaRepository.getMediaByEntry(currentEntryId);
        const order = existingMedia.length;

        await MediaRepository.addMedia({
          entryId: currentEntryId,
          type: preview.type === "photo" ? "image" : "video",
          uri: localUri,
          order,
        });
        console.log("[camera] media row saved — entryId:", currentEntryId, "order:", order);
      } else {
        console.warn("[camera] no currentEntryId — media row not saved to DB");
      }

      setPreview(null);
      setRecentlySavedMediaURI(localUri);
    } catch (error) {
      console.error("[camera] save failed:", error);
    }

    router.back();
  }

  async function handleGallery() {
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
    });
  }

  async function handleNativeCamera() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: mode === "picture" ? ["images"] : ["videos"],
      quality: 1,
      videoMaxDuration: 300,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPreview({
        uri: asset.uri,
        type: asset.type === "video" ? "video" : "photo",
      });
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
