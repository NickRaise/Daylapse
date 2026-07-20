import { create } from "zustand";

export type EditorMedia = {
  uri: string;
  type: "photo" | "video";
  isLoading?: boolean;
};

type EditorState = {
  pendingMedia: EditorMedia | null;
  setPendingMedia: (media: EditorMedia | null) => void;
};

const useEditorStore = create<EditorState>((set) => ({
  pendingMedia: null,
  setPendingMedia: (media) => set({ pendingMedia: media }),
}));

export default useEditorStore;
