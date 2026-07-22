import { useState } from "react";
import { View } from "react-native";
import * as MediaLibrary from "expo-media-library/legacy";
import { captureRef } from "react-native-view-shot";
import { MediaRepository } from "@/repositories/media.repository";
import { mediaService } from "@/service/media.service";
import useEditorStore from "@/store/editor.store";
import useEntryStore from "@/store/entry.store";
import useMediaStore from "@/store/media.store";
import useSettingsStore from "@/store/settings.store";
import type {
  CaptionStyle,
  DateStampFormat,
  DateStampPosition,
  DateStampStyle,
} from "@/types";

type Options = {
  frameRef: React.RefObject<View | null>;
  isVideo: boolean;
  captionStyle: CaptionStyle;
  dateStampStyle: DateStampStyle;
  volume: number;
  dateStampEnabled: boolean;
  dateStampPosition: DateStampPosition;
  dateStampFormat: DateStampFormat;
  onComplete: () => void;
};

type Result = {
  handleSave: () => Promise<void>;
  isSaving: boolean;
};

export function useEditorSave({
  frameRef,
  isVideo,
  captionStyle,
  dateStampStyle,
  volume,
  dateStampEnabled,
  dateStampPosition,
  dateStampFormat,
  onComplete,
}: Options): Result {
  const pendingMedia = useEditorStore((s) => s.pendingMedia);
  const setPendingMedia = useEditorStore((s) => s.setPendingMedia);
  const currentEntryId = useEntryStore((s) => s.currentId);
  const setRecentlySavedMediaURI = useMediaStore(
    (s) => s.setRecentlySavedMediaURI,
  );
  const saveToGallery = useSettingsStore((s) => s.saveToGallery);
  const keepOriginalPhoto = useSettingsStore((s) => s.keepOriginalPhoto);
  const setLastEditorPrefs = useSettingsStore((s) => s.setLastEditorPrefs);

  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!pendingMedia || isSaving) return;
    setIsSaving(true);
    try {
      let localUri: string;

      if (isVideo || keepOriginalPhoto) {
        localUri = await mediaService.copyMedia(pendingMedia.uri);
      } else {
        const capturedUri = await captureRef(frameRef, {
          format: "jpg",
          quality: 0.92,
          result: "tmpfile",
        });
        localUri = await mediaService.copyMedia(capturedUri);
      }

      if (saveToGallery) {
        await MediaLibrary.createAssetAsync(localUri);
      }

      if (currentEntryId !== null) {
        const existingMedia =
          await MediaRepository.getMediaByEntry(currentEntryId);
        await MediaRepository.addMedia({
          entryId: currentEntryId,
          type: isVideo ? "video" : "image",
          uri: localUri,
          order: existingMedia.length,
        });
      }

      setRecentlySavedMediaURI(localUri);

      await setLastEditorPrefs({
        captionStyle,
        dateStampStyle,
        volume,
        dateStampEnabled,
        dateStampPosition,
        dateStampFormat,
      });

      setPendingMedia(null);
    } catch (err) {
      console.error("[editor] save failed:", err);
      setIsSaving(false);
      return;
    }

    onComplete();
  }

  return { handleSave, isSaving };
}
