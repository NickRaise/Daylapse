import { useCameraPermission, useMicrophonePermission } from "react-native-vision-camera";
import * as MediaLibrary from "expo-media-library/legacy";

export function useMediaPermissions() {
  const { hasPermission: camGranted, requestPermission: requestCamPermission } = useCameraPermission();
  const { hasPermission: micGranted, requestPermission: requestMicPermission } = useMicrophonePermission();
  // Full (not write-only) access — saving into the "Daylapse" album requires reading existing
  // albums first to decide whether to create one or add to it.
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  const loading = !mediaPermission;
  const granted = !loading && camGranted && micGranted && mediaPermission.granted;

  async function request() {
    if (!camGranted) await requestCamPermission();
    if (!micGranted) await requestMicPermission();
    if (!mediaPermission?.granted) await requestMediaPermission();
  }

  return { loading, granted, request };
}
