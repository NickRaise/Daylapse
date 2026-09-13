import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { MediaRepository } from "@/repositories/media.repository";
import type { Media } from "@/db/schema";

export function useEntryMedia(entryId: number | null) {
  const [mediaFiles, setMediaFiles] = useState<Media[]>([]);
  const [reorderVisible, setReorderVisible] = useState(false);
  const aliveRef = useRef(true);
  useEffect(() => () => {
    aliveRef.current = false;
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (entryId !== null) {
        MediaRepository.getMediaByEntry(entryId).then((result) => {
          if (aliveRef.current) setMediaFiles(result);
        });
      }
    }, [entryId]),
  );

  const handleDeleteMedia = async (id: number) => {
    await MediaRepository.deleteMedia(id);
    setMediaFiles((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSaveOrder = async (newOrder: Media[]) => {
    setReorderVisible(false);
    setMediaFiles(newOrder);
    await Promise.all(
      newOrder.map((item, index) => MediaRepository.updateOrder(item.id, index)),
    );
  };

  return { mediaFiles, reorderVisible, setReorderVisible, handleDeleteMedia, handleSaveOrder };
}
