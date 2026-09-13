import { db } from "@/db";
import { montages, Montage } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { runQuery } from "@/repositories/util";

type NewMontage = {
  title?: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  outputUri: string;
  duration?: number;
};

export class MontageRepository {
  static async addMontage(data: NewMontage): Promise<number | null> {
    return runQuery("montage.addMontage", async () => {
      const inserted = await db.insert(montages).values(data);
      return Number(inserted.lastInsertRowId);
    }, null);
  }

  static async getAllMontages(): Promise<Montage[]> {
    return runQuery("montage.getAllMontages", () =>
      db.select().from(montages).orderBy(desc(montages.createdAt)),
    []);
  }

  static async deleteMontage(id: number): Promise<boolean> {
    return runQuery("montage.deleteMontage", async () => {
      await db.delete(montages).where(eq(montages.id, id));
      return true;
    }, false);
  }
}
