import { create } from "zustand";
import { File, Paths } from "expo-file-system";

const settingsFile = new File(Paths.document, "app-settings.json");

type Settings = {
  saveToGallery: boolean;
};

type SettingsState = Settings & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSaveToGallery: (value: boolean) => Promise<void>;
};

const DEFAULTS: Settings = {
  saveToGallery: false,
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

const useSettingsStore = create<SettingsState>((set) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    const stored = await readFile();
    set({ ...stored, hydrated: true });
  },

  setSaveToGallery: async (value: boolean) => {
    set({ saveToGallery: value });
    const stored = await readFile();
    writeFile({ ...stored, saveToGallery: value });
  },
}));

export default useSettingsStore;
