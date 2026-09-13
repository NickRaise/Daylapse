import { IEntry, Mood } from "@/types";
import { db } from "@/db/index";
import { entries, Entry } from "@/db/schema";
import { and, eq, lte, gte } from "drizzle-orm";
import { runQuery } from "@/repositories/util";

export class EntryRepository {
  static async createEntry(entry: IEntry): Promise<number | null> {
    return runQuery("entry.createEntry", async () => {
      const newEntry = await db.insert(entries).values({
        date: entry.dateKey,
        journal: entry.journal,
        mood: entry.mood,
        coverMediaId: entry.coverMediaId,
      });
      return Number(newEntry.lastInsertRowId);
    }, null);
  }

  static async getEntryByDate(dateKey: string): Promise<Entry | null> {
    return runQuery("entry.getEntryByDate", async () => {
      const entry = await db.select().from(entries).where(eq(entries.date, dateKey));
      return entry[0] || null;
    }, null);
  }

  static async getEntryById(id: number): Promise<Entry | null> {
    return runQuery("entry.getEntryById", async () => {
      const entry = await db.select().from(entries).where(eq(entries.id, id));
      return entry[0] || null;
    }, null);
  }

  static async updateJournalEntry(
    id: number,
    journal: string,
  ): Promise<boolean> {
    return runQuery("entry.updateJournalEntry", async () => {
      await db.update(entries).set({ journal }).where(eq(entries.id, id));
      return true;
    }, false);
  }

  static async updateMood(id: number, mood: Mood): Promise<boolean> {
    return runQuery("entry.updateMood", async () => {
      await db.update(entries).set({ mood }).where(eq(entries.id, id));
      return true;
    }, false);
  }

  static async getEntriesByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Entry[] | null> {
    return runQuery("entry.getEntriesByDateRange", () =>
      db
        .select()
        .from(entries)
        .where(and(gte(entries.date, startDate), lte(entries.date, endDate))),
    []);
  }
}
