import { create } from "zustand";
import { deleteScratch } from "@/service/storageCleanup";

export type EditorMedia = {
  uri: string;
  type: "photo" | "video";
  isLoading?: boolean;
  /** Real pixel dimensions of the captured/picked media, when known up front (see camera.tsx). */
  width?: number;
  height?: number;
};

type EditorState = {
  pendingMedia: EditorMedia | null;
  setPendingMedia: (media: EditorMedia | null) => void;
};

const useEditorStore = create<EditorState>((set, get) => ({
  pendingMedia: null,
  // A capture is a temp file: once it's replaced (retake), saved (copied out) or abandoned, nothing needs it anymore.
  setPendingMedia: (media) => {
    const previous = get().pendingMedia?.uri;
    set({ pendingMedia: media });
    if (previous && previous !== media?.uri) deleteScratch(previous);
  },
}));

export default useEditorStore;
