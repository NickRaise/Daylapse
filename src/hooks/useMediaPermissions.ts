import {
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import * as MediaLibrary from "expo-media-library/legacy";

export function useMediaPermissions() {
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions(
    { writeOnly: true },
  );

  const loading = !camPermission || !micPermission || !mediaPermission;
  const granted =
    !loading &&
    camPermission.granted &&
    micPermission.granted &&
    mediaPermission.granted;

  async function request() {
    if (!camPermission?.granted) await requestCamPermission();
    if (!micPermission?.granted) await requestMicPermission();
    if (!mediaPermission?.granted) await requestMediaPermission();
  }

  return { loading, granted, request };
}
