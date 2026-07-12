import { create } from "zustand";

interface MediaState {
  recentlySavedMediaURI: string | null;

  setRecentlySavedMediaURI: (uri: string | null) => void;
}

const useMediaStore = create<MediaState>((set) => ({
  recentlySavedMediaURI: null,

  setRecentlySavedMediaURI: (uri: string | null) =>
    set({ recentlySavedMediaURI: uri }),
}));

export default useMediaStore;
