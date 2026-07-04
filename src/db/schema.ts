import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const entries = sqliteTable("entries", {
  id: integer().primaryKey({ autoIncrement: true }),
  date: text().notNull().unique(),
  journal: text(),
  mood: text(),
  coverMediaId: integer("cover_media_id"), // Reference to the Thumbnail media file ID - Foreign key
  createdAt: integer({ mode: "timestamp" }).notNull(),
  updatedAt: integer({ mode: "timestamp" }).notNull(),
});

export const media = sqliteTable("media", {
  id: integer().primaryKey({ autoIncrement: true }),
  entryId: integer("entry_id").notNull(), // - Foreign key
  type: text({ enum: ["image", "video"] }).notNull(),
  uri: text().notNull(),
  thumbnailUri: text(), // For videos, store the thumbnail URI
  caption: text(),
  duration: integer(), // Duration in seconds for videos
  order: integer().notNull().default(0), // Order of media files for a specific entry
  createdAt: integer({ mode: "timestamp" }).notNull(),
});
