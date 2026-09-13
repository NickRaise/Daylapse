import { useState } from "react";
import { View } from "react-native";
import * as MediaLibrary from "expo-media-library/legacy";
import { captureRef } from "react-native-view-shot";
import { MediaRepository } from "@/repositories/media.repository";
import { mediaService } from "@/service/media.service";
import useEditorStore from "@/store/editor.store";
import useEntryStore from "@/store/entry.store";
import useSettingsStore from "@/store/settings.store";
import { toFileUri } from "@/utils/fileUri";
import type { CaptionStyle } from "@/types";
import type { TrimRange } from "@/components/editor/TrimPanel";

type Options = {
  frameRef: React.RefObject<View | null>;
  isVideo: boolean;
  captionStyle: CaptionStyle;
  volume: number;
  dateStampEnabled: boolean;
  trimRangeRef: React.RefObject<TrimRange>;
  videoDuration: number;
  photoDuration: number;
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
  volume,
  dateStampEnabled,
  trimRangeRef,
  videoDuration,
  photoDuration,
  onComplete,
}: Options): Result {
  const pendingMedia = useEditorStore((s) => s.pendingMedia);
  const setPendingMedia = useEditorStore((s) => s.setPendingMedia);
  const currentEntryId = useEntryStore((s) => s.currentId);
  const saveToGallery = useSettingsStore((s) => s.saveToGallery);
  const keepOriginalPhoto = useSettingsStore((s) => s.keepOriginalPhoto);
  const setLastEditorPrefs = useSettingsStore((s) => s.setLastEditorPrefs);

  const [isSaving, setIsSaving] = useState(false);

  // Skips the (re-encoding) trim step entirely when the user never shortened the clip.
  async function trimIfNeeded(uri: string): Promise<string> {
    const { start, end } = trimRangeRef.current;
    if (start < 0.05 && end > videoDuration - 0.05) return uri;
    try {
      // Required lazily — a static import crashes at module-load time (breaking the whole editor screen) until the native module is linked via a dev-client rebuild.
      const mod = require("react-native-video-trim");
      const trim = mod?.trim ?? mod?.default?.trim;
      if (!trim) throw new Error("react-native-video-trim native module not available");
      const result = await trim(uri, {
        startTime: Math.round(start * 1000),
        endTime: Math.round(end * 1000),
        enablePreciseTrimming: true,
      });
      return toFileUri(result.outputPath);
    } catch (error) {
      console.error("[editor] video trim failed, saving untrimmed:", error);
      return uri;
    }
  }

  async function handleSave() {
    if (!pendingMedia || isSaving) return;
    setIsSaving(true);
    try {
      let localUri: string;

      if (isVideo) {
        const trimmedUri = await trimIfNeeded(pendingMedia.uri);
        localUri = await mediaService.copyMedia(trimmedUri);
      } else if (keepOriginalPhoto) {
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
          duration: isVideo ? undefined : photoDuration,
        });
      }

      await setLastEditorPrefs({
        captionStyle,
        volume,
        dateStampEnabled,
        photoDuration,
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
