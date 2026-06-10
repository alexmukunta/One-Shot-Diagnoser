import {
  pgTable,
  text,
  serial,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const statusPagesTable = pgTable("status_pages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const statusPageMonitorsTable = pgTable("status_page_monitors", {
  id: serial("id").primaryKey(),
  statusPageId: integer("status_page_id").notNull(),
  monitorId: integer("monitor_id").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const insertStatusPageSchema = createInsertSchema(
  statusPagesTable
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStatusPage = z.infer<typeof insertStatusPageSchema>;
export type StatusPage = typeof statusPagesTable.$inferSelect;
