import { db } from "@/db";
import type { IMedia } from "@/types";
import { Media, media, entries } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { runQuery } from "@/repositories/util";

export class MediaRepository {
  static async addMedia(data: IMedia): Promise<number | null> {
    return runQuery("media.addMedia", async () => {
      const newMedia = await db.insert(media).values({
        entryId: data.entryId,
        type: data.type,
        uri: data.uri,
        caption: data.caption,
        duration: data.duration,
        order: data.order,
      });
      return Number(newMedia.lastInsertRowId);
    }, null);
  }

  static async getMediaByEntry(entryId: number): Promise<Media[]> {
    return runQuery("media.getMediaByEntry", () =>
      db.select().from(media).where(eq(media.entryId, entryId)),
    []);
  }

  static async updateOrder(id: number, order: number): Promise<boolean> {
    return runQuery("media.updateOrder", async () => {
      await db.update(media).set({ order }).where(eq(media.id, id));
      return true;
    }, false);
  }

  static async deleteMedia(id: number): Promise<boolean> {
    return runQuery("media.deleteMedia", async () => {
      await db.delete(media).where(eq(media.id, id));
      return true;
    }, false);
  }

  static async getFirstMediaByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Record<string, string>> {
    return runQuery("media.getFirstMediaByDateRange", async () => {
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
    }, {});
  }
}
