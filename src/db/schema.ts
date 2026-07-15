import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const moods = ["happy", "calm", "neutral", "sad", "angry"] as const;

export const entries = sqliteTable("entries", {
  id: integer().primaryKey({ autoIncrement: true }),
  date: text().notNull().unique(),
  journal: text(),
  mood: text({ enum: moods }),
  coverMediaId: integer("cover_media_id"), // Reference to the Thumbnail media file ID - Foreign key
  createdAt: integer({ mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
  updatedAt: integer({ mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
});

export const media = sqliteTable("media", {
  id: integer().primaryKey({ autoIncrement: true }),
  entryId: integer("entry_id").notNull(), // - Foreign key
  type: text({ enum: ["image", "video"] }).notNull(),
  uri: text().notNull(),
  caption: text(),
  duration: integer(), // Duration in seconds for videos
  order: integer().notNull().default(0), // Order of media files for a specific entry
  createdAt: integer({ mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
});

export type Media = typeof media.$inferSelect;
export type Entry = typeof entries.$inferSelect;
