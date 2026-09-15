import { create } from "zustand";
import { File, Paths } from "expo-file-system";
import type { AspectRatio, CaptionStyle } from "@/types";
import { readStoredTheme, type ThemeName } from "@/theme";

const settingsFile = new File(Paths.document, "app-settings.json");

export type VideoQuality = "low" | "medium" | "high";
export type FrameFillColor = "white" | "black" | "theme";

type Settings = {
  // Appearance
  theme: ThemeName;
  // Camera
  saveToGallery: boolean;
  videoQuality: VideoQuality;
  useNativeCamera: boolean;
  recordingTimeLimit: number | null;
  // Editor frame
  defaultAspectRatio: AspectRatio;
  frameFillColor: FrameFillColor;
  // Storage
  keepOriginalMedia: boolean;
  // Daily reminder
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  // Onboarding
  hasSeenOnboarding: boolean;
  // Editor prefs — auto-saved on every save, not exposed in settings UI
  lastDateStampEnabled: boolean;
  lastCaptionStyle: CaptionStyle;
  lastVolume: number;
  lastPhotoDuration: number;
};

type SettingsState = Settings & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSaveToGallery: (value: boolean) => Promise<void>;
  setVideoQuality: (value: VideoQuality) => Promise<void>;
  setUseNativeCamera: (value: boolean) => Promise<void>;
  setRecordingTimeLimit: (value: number | null) => Promise<void>;
  setDefaultAspectRatio: (value: AspectRatio) => Promise<void>;
  setFrameFillColor: (value: FrameFillColor) => Promise<void>;
  setKeepOriginalMedia: (value: boolean) => Promise<void>;
  setReminderEnabled: (value: boolean) => Promise<void>;
  setReminderTime: (hour: number, minute: number) => Promise<void>;
  setHasSeenOnboarding: (value: boolean) => Promise<void>;
  setTheme: (value: ThemeName) => Promise<void>;
  setLastEditorPrefs: (prefs: {
    captionStyle: CaptionStyle;
    volume: number;
    dateStampEnabled: boolean;
    photoDuration: number;
  }) => Promise<void>;
};

const DEFAULTS: Settings = {
  theme: readStoredTheme(),
  saveToGallery: false,
  videoQuality: "high",
  useNativeCamera: false,
  recordingTimeLimit: null,
  defaultAspectRatio: "4:3",
  frameFillColor: "black",
  keepOriginalMedia: false,
  reminderEnabled: false,
  reminderHour: 20,
  reminderMinute: 0,
  hasSeenOnboarding: false,
  lastDateStampEnabled: false,
  lastCaptionStyle: {
    textColor: "#FFFFFF",
    bgColor: "rgba(0,0,0,0.5)",
    size: "md",
    position: "bottom-left",
  },
  lastVolume: 1,
  lastPhotoDuration: 1,
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
    theme: state.theme,
    saveToGallery: state.saveToGallery,
    videoQuality: state.videoQuality,
    useNativeCamera: state.useNativeCamera,
    recordingTimeLimit: state.recordingTimeLimit,
    defaultAspectRatio: state.defaultAspectRatio,
    frameFillColor: state.frameFillColor,
    keepOriginalMedia: state.keepOriginalMedia,
    reminderEnabled: state.reminderEnabled,
    reminderHour: state.reminderHour,
    reminderMinute: state.reminderMinute,
    hasSeenOnboarding: state.hasSeenOnboarding,
    lastDateStampEnabled: state.lastDateStampEnabled,
    lastCaptionStyle: state.lastCaptionStyle,
    lastVolume: state.lastVolume,
    lastPhotoDuration: state.lastPhotoDuration,
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
    setFrameFillColor: async (value) => persist({ frameFillColor: value }),
    setKeepOriginalMedia: async (value) => persist({ keepOriginalMedia: value }),
    setReminderEnabled: async (value) => persist({ reminderEnabled: value }),
    setReminderTime: async (hour, minute) => persist({ reminderHour: hour, reminderMinute: minute }),
    setHasSeenOnboarding: async (value) => persist({ hasSeenOnboarding: value }),

    setTheme: async (value) => persist({ theme: value }),

    setLastEditorPrefs: async ({ captionStyle, volume, dateStampEnabled, photoDuration }) =>
      persist({
        lastCaptionStyle: captionStyle,
        lastVolume: volume,
        lastDateStampEnabled: dateStampEnabled,
        lastPhotoDuration: photoDuration,
      }),
  };
});

export default useSettingsStore;
