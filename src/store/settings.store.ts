import { create } from "zustand";
import { File, Paths } from "expo-file-system";
import type { AspectRatio, CaptionStyle } from "@/types";

const settingsFile = new File(Paths.document, "app-settings.json");

export type VideoQuality = "low" | "medium" | "high";

type Settings = {
  // Camera
  saveToGallery: boolean;
  videoQuality: VideoQuality;
  useNativeCamera: boolean;
  recordingTimeLimit: number | null;
  // Editor frame
  defaultAspectRatio: AspectRatio;
  // Storage
  keepOriginalPhoto: boolean;
  // Editor prefs — auto-saved on every save, not exposed in settings UI
  lastDateStampEnabled: boolean;
  lastCaptionStyle: CaptionStyle;
  lastVolume: number;
};

type SettingsState = Settings & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSaveToGallery: (value: boolean) => Promise<void>;
  setVideoQuality: (value: VideoQuality) => Promise<void>;
  setUseNativeCamera: (value: boolean) => Promise<void>;
  setRecordingTimeLimit: (value: number | null) => Promise<void>;
  setDefaultAspectRatio: (value: AspectRatio) => Promise<void>;
  setKeepOriginalPhoto: (value: boolean) => Promise<void>;
  setLastEditorPrefs: (prefs: {
    captionStyle: CaptionStyle;
    volume: number;
    dateStampEnabled: boolean;
  }) => Promise<void>;
};

const DEFAULTS: Settings = {
  saveToGallery: false,
  videoQuality: "high",
  useNativeCamera: false,
  recordingTimeLimit: null,
  defaultAspectRatio: "4:3",
  keepOriginalPhoto: false,
  lastDateStampEnabled: false,
  lastCaptionStyle: {
    textColor: "#FFFFFF",
    bgColor: "rgba(0,0,0,0.5)",
    size: "md",
    position: "bottom-left",
  },
  lastVolume: 1,
};

async function readFile(): Promise<Settings> {
  try {
    if (!settingsFile.exists) return DEFAULTS;
    const raw = await settingsFile.text();
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

async function writeFile(data: Settings) {
  try {
    await settingsFile.write(JSON.stringify(data));
  } catch (error) {
    console.error("[settings] write failed:", error);
  }
}

function pickSettings(state: SettingsState): Settings {
  return {
    saveToGallery: state.saveToGallery,
    videoQuality: state.videoQuality,
    useNativeCamera: state.useNativeCamera,
    recordingTimeLimit: state.recordingTimeLimit,
    defaultAspectRatio: state.defaultAspectRatio,
    keepOriginalPhoto: state.keepOriginalPhoto,
    lastDateStampEnabled: state.lastDateStampEnabled,
    lastCaptionStyle: state.lastCaptionStyle,
    lastVolume: state.lastVolume,
  };
}

const useSettingsStore = create<SettingsState>((set, get) => {
  // Applies a partial settings change and persists the full merged settings to disk.
  function persist(patch: Partial<Settings>) {
    set(patch);
    writeFile({ ...pickSettings(get()), ...patch });
  }

  return {
    ...DEFAULTS,
    hydrated: false,

    hydrate: async () => {
      const stored = await readFile();
      set({ ...stored, hydrated: true });
    },

    setSaveToGallery: async (value) => persist({ saveToGallery: value }),
    setVideoQuality: async (value) => persist({ videoQuality: value }),
    setUseNativeCamera: async (value) => persist({ useNativeCamera: value }),
    setRecordingTimeLimit: async (value) => persist({ recordingTimeLimit: value }),
    setDefaultAspectRatio: async (value) => persist({ defaultAspectRatio: value }),
    setKeepOriginalPhoto: async (value) => persist({ keepOriginalPhoto: value }),

    setLastEditorPrefs: async ({ captionStyle, volume, dateStampEnabled }) =>
      persist({
        lastCaptionStyle: captionStyle,
        lastVolume: volume,
        lastDateStampEnabled: dateStampEnabled,
      }),
  };
});

export default useSettingsStore;
