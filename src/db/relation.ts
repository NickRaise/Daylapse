import { relations } from "drizzle-orm";
import { entries, media } from "./schema";

export const entryRelations = relations(entries, ({ many }) => ({
  media: many(media),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  entry: one(entries, {
    fields: [media.entryId],
    references: [entries.id],
  }),
}));
