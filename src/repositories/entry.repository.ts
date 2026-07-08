import { IEntry, Mood } from "@/types";
import { db } from "@/db/index";
import { entries, Entry } from "@/db/schema";
import { and, eq, lte, gte } from "drizzle-orm";

export class EntryRepository {
  async createEntry(entry: IEntry): Promise<number | null> {
    try {
      const newEntry = await db.insert(entries).values({
        date: entry.dateKey,
        journal: entry.journal,
        mood: entry.mood,
        ...(entry.coverMedia !== undefined
          ? { coverMediaId: entry.coverMedia }
          : {}),
      });
      return Number(newEntry.lastInsertRowId);
    } catch (error) {
      console.error("Error creating entry:", error);
      return null;
    }
  }

  async getEntryByDate(dateKey: string): Promise<Entry | null> {
    try {
      const entry = await db
        .select()
        .from(entries)
        .where(eq(entries.date, dateKey));
      return entry[0] || null;
    } catch (error) {
      console.error("Error fetching entry by date:", error);
      return null;
    }
  }

  async getEntryById(id: number): Promise<Entry | null> {
    try {
      const entry = await db.select().from(entries).where(eq(entries.id, id));
      return entry[0] || null;
    } catch (error) {
      console.error("Error fetching entry by ID:", error);
      return null;
    }
  }

  async updateJournalEntry(id: number, journal: string): Promise<boolean> {
    try {
      await db.update(entries).set({ journal }).where(eq(entries.id, id));
      return true;
    } catch (error) {
      console.error("Error updating journal entry:", error);
      return false;
    }
  }

  async updateMood(id: number, mood: Mood): Promise<boolean> {
    try {
      await db.update(entries).set({ mood }).where(eq(entries.id, id));
      return true;
    } catch (error) {
      console.error("Error updating mood:", error);
      return false;
    }
  }

  async updateCoverMedia(id: number, coverMediaId: number): Promise<boolean> {
    try {
      await db.update(entries).set({ coverMediaId }).where(eq(entries.id, id));
      return true;
    } catch (error) {
      console.error("Error updating cover media:", error);
      return false;
    }
  }

  async getEntriesByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Entry[] | null> {
    try {
      const entriesData = await db
        .select()
        .from(entries)
        .where(and(gte(entries.date, startDate), lte(entries.date, endDate)));
      return entriesData;
    } catch (error) {
      console.error("Error fetching entries by date range:", error);
      return [];
    }
  }

  async deleteEntry(id: number): Promise<boolean> {
    try {
      await db.delete(entries).where(eq(entries.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting entry:", error);
      return false;
    }
  }
}
