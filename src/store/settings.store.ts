import { create } from "zustand";
import { File, Paths } from "expo-file-system";

const settingsFile = new File(Paths.document, "app-settings.json");

export type VideoQuality = "low" | "medium" | "high";

type Settings = {
  saveToGallery: boolean;
  videoQuality: VideoQuality;
  useNativeCamera: boolean;
  recordingTimeLimit: number | null;
};

type SettingsState = Settings & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSaveToGallery: (value: boolean) => Promise<void>;
  setVideoQuality: (value: VideoQuality) => Promise<void>;
  setUseNativeCamera: (value: boolean) => Promise<void>;
  setRecordingTimeLimit: (value: number | null) => Promise<void>;
};

const DEFAULTS: Settings = {
  saveToGallery: false,
  videoQuality: "high",
  useNativeCamera: false,
  recordingTimeLimit: null,
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
}));

export default useSettingsStore;
