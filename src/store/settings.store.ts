import { create } from "zustand";
import { File, Paths } from "expo-file-system";
import type { AspectRatio, DateStampFormat, DateStampPosition } from "@/types";

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
  // Editor date stamp prefs (auto-saved by editor, not in settings UI)
  lastDateStampEnabled: boolean;
  lastDateStampPosition: DateStampPosition;
  lastDateStampFormat: DateStampFormat;
};

type SettingsState = Settings & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSaveToGallery: (value: boolean) => Promise<void>;
  setVideoQuality: (value: VideoQuality) => Promise<void>;
  setUseNativeCamera: (value: boolean) => Promise<void>;
  setRecordingTimeLimit: (value: number | null) => Promise<void>;
  setDefaultAspectRatio: (value: AspectRatio) => Promise<void>;
  setLastDateStampPrefs: (prefs: {
    enabled: boolean;
    position: DateStampPosition;
    format: DateStampFormat;
  }) => Promise<void>;
};

const DEFAULTS: Settings = {
  saveToGallery: false,
  videoQuality: "high",
  useNativeCamera: false,
  recordingTimeLimit: null,
  defaultAspectRatio: "4:3",
  lastDateStampEnabled: false,
  lastDateStampPosition: "bottom-right",
  lastDateStampFormat: "DD MMM YYYY",
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

function writeFile(data: Settings) {
  settingsFile.write(JSON.stringify(data));
}

function pickSettings(state: SettingsState): Settings {
  return {
    saveToGallery: state.saveToGallery,
    videoQuality: state.videoQuality,
    useNativeCamera: state.useNativeCamera,
    recordingTimeLimit: state.recordingTimeLimit,
    defaultAspectRatio: state.defaultAspectRatio,
    lastDateStampEnabled: state.lastDateStampEnabled,
    lastDateStampPosition: state.lastDateStampPosition,
    lastDateStampFormat: state.lastDateStampFormat,
  };
}

const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    const stored = await readFile();
    set({ ...stored, hydrated: true });
  },

  setSaveToGallery: async (value) => {
    set({ saveToGallery: value });
    writeFile({ ...pickSettings(get()), saveToGallery: value });
  },

  setVideoQuality: async (value) => {
    set({ videoQuality: value });
    writeFile({ ...pickSettings(get()), videoQuality: value });
  },

  setUseNativeCamera: async (value) => {
    set({ useNativeCamera: value });
    writeFile({ ...pickSettings(get()), useNativeCamera: value });
  },

  setRecordingTimeLimit: async (value) => {
    set({ recordingTimeLimit: value });
    writeFile({ ...pickSettings(get()), recordingTimeLimit: value });
  },

  setDefaultAspectRatio: async (value) => {
    set({ defaultAspectRatio: value });
    writeFile({ ...pickSettings(get()), defaultAspectRatio: value });
  },

  setLastDateStampPrefs: async ({ enabled, position, format }) => {
    set({
      lastDateStampEnabled: enabled,
      lastDateStampPosition: position,
      lastDateStampFormat: format,
    });
    writeFile({
      ...pickSettings(get()),
      lastDateStampEnabled: enabled,
      lastDateStampPosition: position,
      lastDateStampFormat: format,
    });
  },
}));

export default useSettingsStore;
