import { create } from "zustand";
import { File, Paths } from "expo-file-system";
import type { AspectRatio, CaptionStyle, DateStampFormat, DateStampPosition } from "@/types";

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
  lastDateStampPosition: DateStampPosition;
  lastDateStampFormat: DateStampFormat;
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
    dateStampPosition: DateStampPosition;
    dateStampFormat: DateStampFormat;
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
  lastDateStampPosition: "bottom-right",
  lastDateStampFormat: "DD MMM YYYY",
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
    keepOriginalPhoto: state.keepOriginalPhoto,
    lastDateStampEnabled: state.lastDateStampEnabled,
    lastDateStampPosition: state.lastDateStampPosition,
    lastDateStampFormat: state.lastDateStampFormat,
    lastCaptionStyle: state.lastCaptionStyle,
    lastVolume: state.lastVolume,
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

  setKeepOriginalPhoto: async (value) => {
    set({ keepOriginalPhoto: value });
    writeFile({ ...pickSettings(get()), keepOriginalPhoto: value });
  },

  setLastEditorPrefs: async ({ captionStyle, volume, dateStampEnabled, dateStampPosition, dateStampFormat }) => {
    set({
      lastCaptionStyle: captionStyle,
      lastVolume: volume,
      lastDateStampEnabled: dateStampEnabled,
      lastDateStampPosition: dateStampPosition,
      lastDateStampFormat: dateStampFormat,
    });
    writeFile({
      ...pickSettings(get()),
      lastCaptionStyle: captionStyle,
      lastVolume: volume,
      lastDateStampEnabled: dateStampEnabled,
      lastDateStampPosition: dateStampPosition,
      lastDateStampFormat: dateStampFormat,
    });
  },
}));

export default useSettingsStore;
