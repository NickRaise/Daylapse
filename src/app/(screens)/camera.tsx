import { Camera as VisionCamera, useCameraDevice, useCameraFormat } from "react-native-vision-camera";
// TODO (dev build): switch to "expo-media-library" (non-legacy) and replace createAssetAsync → Asset.create()
import * as ImagePicker from "expo-image-picker";
import { useCallback, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { makeStyles, useColors } from "../../theme";
import { CameraPermission } from "../../components/camera/CameraPermission";
import { CameraViewfinder } from "../../components/camera/CameraViewfinder";
import { CameraControls, type CameraCaptureMode } from "../../components/camera/CameraControls";
import useEditorStore from "@/store/editor.store";
import useSettingsStore from "@/store/settings.store";
import { PHOTO_QUALITY, VIDEO_RESOLUTION, TARGET_VIDEO_FPS, CAMERA_VIDEO_BITRATE } from "@/constants/media";
import { toFileUri } from "@/utils/fileUri";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import { useRecordingTimer } from "@/hooks/useRecordingTimer";

export default function Camera() {
  const s = useStyles();
  const cameraRef = useRef<VisionCamera>(null);
  const router = useRouter();
  const isHoldRecordingRef = useRef(false);
  const sentToEditorRef = useRef(false); // tracks that we navigated to editor
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setPendingMedia = useEditorStore((s) => s.setPendingMedia);
  const pendingMedia = useEditorStore((s) => s.pendingMedia);

  const videoQuality = useSettingsStore((state) => state.videoQuality);
  const recordingTimeLimit = useSettingsStore((state) => state.recordingTimeLimit);

  const [facing, setFacing] = useState<"back" | "front">("back");
  const [mode, setMode] = useState<CameraCaptureMode>("picture");
  const [isRecording, setIsRecording] = useState(false);
  const [isHoldRecording, setIsHoldRecording] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);

  const { loading, granted, request } = useMediaPermissions();
  const { duration: recordingDuration, startTimer, stopTimer } = useRecordingTimer();

  const device = useCameraDevice(facing);
  // Both photo and video capture stay enabled at once (see CameraViewfinder), so the chosen format/fps just needs to satisfy video — no per-mode reconfiguration, which is what made hold-to-record feel sluggish before.
  const format = useCameraFormat(device, [
    { videoResolution: VIDEO_RESOLUTION[videoQuality] },
    { fps: TARGET_VIDEO_FPS },
  ]);
  const fps = format ? Math.min(TARGET_VIDEO_FPS, format.maxFps) : 30;

  // When focus returns from editor and editor has cleared the pending media, dismiss camera too
  useFocusEffect(
    useCallback(() => {
      if (sentToEditorRef.current && !pendingMedia) {
        router.back();
      }
    }, [pendingMedia]),
  );

  // Re-arms the camera whenever this screen regains focus — covers the "Retake" flow, where editor sends us back without clearing pendingMedia.
  useFocusEffect(
    useCallback(() => {
      setCameraActive(true);
    }, []),
  );

  if (loading) return <View style={s.root} />;
  if (!granted) return <CameraPermission onRequest={request} />;

  // ── Capture handlers ──────────────────────────────────────────────────────

  function openEditor(
    uri: string,
    type: "photo" | "video",
    isLoading = false,
    dims?: { width: number; height: number },
  ) {
    sentToEditorRef.current = true;
    setPendingMedia({ uri, type, isLoading, ...dims });
    router.push("/editor");
  }

  // Shared by the tap-to-record and hold-to-record flows below.
  function recordVideo(): Promise<void> {
    return new Promise((resolve) => {
      if (!cameraRef.current) return resolve();
      if (recordingTimeLimit) {
        recordingTimeoutRef.current = setTimeout(() => {
          cameraRef.current?.stopRecording().catch(() => {});
        }, recordingTimeLimit * 1000);
      }
      cameraRef.current.startRecording({
        onRecordingFinished: (video) => {
          if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
          setCameraActive(false);
          setPendingMedia({ uri: toFileUri(video.path), type: "video", isLoading: false });
          resolve();
        },
        onRecordingError: (error) => {
          if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
          setCameraActive(false);
          console.error("[camera] recording failed:", error);
          setPendingMedia(null);
          sentToEditorRef.current = false;
          resolve();
        },
      });
    });
  }

  async function handleCapture() {
    if (!cameraRef.current || !cameraReady || isBusy || isHoldRecording) return;

    if (mode === "picture") {
      setIsBusy(true);
      try {
        const photo = await cameraRef.current.takePhoto({ enableShutterSound: false });
        // Sensors are physically landscape, so photo.width/height are always landscape-shaped — swap them back when the phone was actually held in portrait.
        const heldPortrait = photo.orientation === "portrait" || photo.orientation === "portrait-upside-down";
        const dims = heldPortrait
          ? { width: photo.height, height: photo.width }
          : { width: photo.width, height: photo.height };
        setCameraActive(false);
        openEditor(toFileUri(photo.path), "photo", false, dims);
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
      cameraRef.current.stopRecording().catch(() => {});
      return;
    }
    setIsRecording(true);
    startTimer();
    try {
      await recordVideo();
    } finally {
      setIsRecording(false);
      stopTimer();
    }
  }

  async function handleLongPressCapture() {
    if (!cameraRef.current || !cameraReady || mode !== "picture" || isHoldRecording) return;

    isHoldRecordingRef.current = true;
    setIsHoldRecording(true);
    setIsRecording(true);
    startTimer();
    try {
      await recordVideo();
    } finally {
      isHoldRecordingRef.current = false;
      setIsHoldRecording(false);
      setIsRecording(false);
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
    cameraRef.current?.stopRecording().catch(() => {});
  }

  async function handleGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"] });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      openEditor(asset.uri, asset.type === "video" ? "video" : "photo", false, {
        width: asset.width,
        height: asset.height,
      });
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
      openEditor(asset.uri, asset.type === "video" ? "video" : "photo", false, {
        width: asset.width,
        height: asset.height,
      });
    }
  }

  function handleModeChange(next: CameraCaptureMode) {
    if (isRecording) return;
    setMode(next);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <CameraViewfinder
        cameraRef={cameraRef}
        device={device}
        format={format}
        fps={fps}
        videoBitRate={CAMERA_VIDEO_BITRATE[videoQuality]}
        isActive={cameraActive}
        isRecording={isRecording}
        onInitialized={() => setCameraReady(true)}
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

const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
}));
