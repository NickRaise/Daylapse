import { db } from "@/db";
import { IMedia } from "@/types";
import { Media, media, entries } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export class MediaRepository {
  static async addMedia(data: IMedia): Promise<number | null> {
    try {
      const newMedia = await db.insert(media).values({
        entryId: data.entryId,
        type: data.type,
        uri: data.uri,
        caption: data.caption,
        duration: data.duration,
        order: data.order,
      });
      return Number(newMedia.lastInsertRowId);
    } catch (error) {
      console.error("Error adding media:", error);
      return null;
    }
  }

  static async getMediaByEntry(entryId: number): Promise<Media[]> {
    try {
      const mediaFiles = await db
        .select()
        .from(media)
        .where(eq(media.entryId, entryId));
      return mediaFiles;
    } catch (error) {
      console.error("Error fetching media by entry:", error);
      return [];
    }
  }

  static async getMediaById(id: number): Promise<Media | null> {
    try {
      const mediaFile = await db.select().from(media).where(eq(media.id, id));
      return mediaFile[0] || null;
    } catch (error) {
      console.error("Error fetching media by ID:", error);
      return null;
    }
  }

  static async updateCaption(id: number, caption: string): Promise<boolean> {
    try {
      await db.update(media).set({ caption }).where(eq(media.id, id));
      return true;
    } catch (error) {
      console.error("Error updating media caption:", error);
      return false;
    }
  }

  static async updateOrder(id: number, order: number): Promise<boolean> {
    try {
      await db.update(media).set({ order }).where(eq(media.id, id));
      return true;
    } catch (error) {
      console.error("Error updating media order:", error);
      return false;
    }
  }

  static async deleteMedia(id: number): Promise<boolean> {
    try {
      await db.delete(media).where(eq(media.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting media:", error);
      return false;
    }
  }

  static async getFirstMediaByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Record<string, string>> {
    try {
      const rows = await db
        .select({ date: entries.date, uri: media.uri })
        .from(entries)
        .innerJoin(
          media,
          and(eq(media.entryId, entries.id), eq(media.order, 0)),
        )
        .where(and(gte(entries.date, startDate), lte(entries.date, endDate)));
      const result: Record<string, string> = {};
      for (const row of rows) result[row.date] = row.uri;
      return result;
    } catch (error) {
      console.error("[media] getFirstMediaByDateRange failed:", error);
      return {};
    }
  }

  static async deleteByEntry(entryId: number): Promise<boolean> {
    try {
      await db.delete(media).where(eq(media.entryId, entryId));
      return true;
    } catch (error) {
      console.error("Error deleting media by entry:", error);
      return false;
    }
  }
}
