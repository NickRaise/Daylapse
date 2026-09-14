import { useCameraPermission, useMicrophonePermission } from "react-native-vision-camera";
import * as MediaLibrary from "expo-media-library/legacy";

export function useMediaPermissions() {
  const { hasPermission: camGranted, requestPermission: requestCamPermission } = useCameraPermission();
  const { hasPermission: micGranted, requestPermission: requestMicPermission } = useMicrophonePermission();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions({ writeOnly: true });

  const loading = !mediaPermission;
  const granted = !loading && camGranted && micGranted && mediaPermission.granted;

  async function request() {
    if (!camGranted) await requestCamPermission();
    if (!micGranted) await requestMicPermission();
    if (!mediaPermission?.granted) await requestMediaPermission();
  }

  return { loading, granted, request };
}
