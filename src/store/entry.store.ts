import { Mood } from "@/types";
import { Entry } from "@/db/schema";
import { EntryRepository } from "@/repositories/entry.repository";
import { create } from "zustand";

interface EntryState {
  currentId: number | null;
  currentDateKey: string;
  currentJournalText: string;
  currentMood: Mood | null;
  isLoading: boolean;
  // Keyed by dateKey — text data is tiny, cache the whole range of visible months
  entriesCache: Record<string, Entry>;

  createEntry: (dateKey: string) => Promise<void>;
  updateMood: (mood: Mood | null) => Promise<void>;
  saveJournal: (text: string) => Promise<void>;
  loadEntriesCache: (startDate: string, endDate: string) => Promise<void>;
}

const useEntryStore = create<EntryState>((set, get) => ({
  currentId: null,
  currentDateKey: "",
  currentJournalText: "",
  currentMood: null,
  isLoading: false,
  entriesCache: {},

  // Batch-load all entries in the visible calendar range once on calendar mount
  loadEntriesCache: async (startDate: string, endDate: string) => {
    const rows = await EntryRepository.getEntriesByDateRange(
      startDate,
      endDate,
    );
    if (!rows) return;
    const map: Record<string, Entry> = {};
    for (const e of rows) map[e.date] = e;
    set({ entriesCache: map });
  },

  // Cache-first: instant for days already seen, DB-only for new ones
  createEntry: async (dateKey: string) => {
    const cached = get().entriesCache[dateKey];
    if (cached) {
      set({
        currentId: cached.id,
        currentDateKey: dateKey,
        currentJournalText: cached.journal ?? "",
        currentMood: (cached.mood as Mood) ?? null,
      });
      return;
    }

    set({ isLoading: true });
    try {
      let entry = await EntryRepository.getEntryByDate(dateKey);
      if (!entry) {
        const newId = await EntryRepository.createEntry({ dateKey });
        if (newId) entry = await EntryRepository.getEntryById(newId);
      }
      if (entry) {
        set((s) => ({
          currentId: entry!.id,
          currentDateKey: dateKey,
          currentJournalText: entry!.journal ?? "",
          currentMood: (entry!.mood as Mood) ?? null,
          entriesCache: { ...s.entriesCache, [dateKey]: entry! },
        }));
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // Optimistic update: UI reflects instantly, DB and cache follow
  updateMood: async (mood: Mood | null) => {
    const { currentId, currentDateKey } = get();
    set((s) => {
      const existing = s.entriesCache[currentDateKey];
      return {
        currentMood: mood,
        entriesCache: existing
          ? { ...s.entriesCache, [currentDateKey]: { ...existing, mood } }
          : s.entriesCache,
      };
    });
    if (currentId !== null && mood !== null) {
      await EntryRepository.updateMood(currentId, mood);
    }
  },

  saveJournal: async (text: string) => {
    const { currentId, currentDateKey } = get();
    set((s) => {
      const existing = s.entriesCache[currentDateKey];
      return {
        currentJournalText: text,
        entriesCache: existing
          ? {
              ...s.entriesCache,
              [currentDateKey]: { ...existing, journal: text },
            }
          : s.entriesCache,
      };
    });
    if (currentId !== null) {
      await EntryRepository.updateJournalEntry(currentId, text);
    }
  },
}));

export default useEntryStore;
