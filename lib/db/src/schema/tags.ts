import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tagsTable = pgTable(
  "tags",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull().default("#6366f1"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tags_user_id_idx").on(table.userId),
  ],
);

export const monitorTagsTable = pgTable("monitor_tags", {
  monitorId: integer("monitor_id").notNull(),
  tagId: integer("tag_id").notNull(),
});

export const insertTagSchema = createInsertSchema(tagsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tagsTable.$inferSelect;
