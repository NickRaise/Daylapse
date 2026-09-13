import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import useEditorStore from "@/store/editor.store";
import useSettingsStore from "@/store/settings.store";
import { PHOTO_QUALITY } from "@/constants/media";

// Shared by any "add media" entry point: skips the in-app camera screen entirely when the native-camera setting is on, going straight to the system picker.
export function useOpenCamera() {
  const router = useRouter();
  const setPendingMedia = useEditorStore((s) => s.setPendingMedia);
  const useNativeCamera = useSettingsStore((s) => s.useNativeCamera);
  const videoQuality = useSettingsStore((s) => s.videoQuality);
  const recordingTimeLimit = useSettingsStore((s) => s.recordingTimeLimit);

  return async function openCamera(dateKey: string) {
    if (useNativeCamera) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images", "videos"],
        quality: PHOTO_QUALITY[videoQuality],
        videoMaxDuration: recordingTimeLimit ?? 300,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      setPendingMedia({
        uri: asset.uri,
        type: asset.type === "video" ? "video" : "photo",
        width: asset.width,
        height: asset.height,
      });
      router.push("/editor");
      return;
    }
    router.push({ pathname: "/camera", params: { dateKey } });
  };
}
