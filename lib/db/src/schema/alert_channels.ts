import { pgTable, text, serial, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertChannelsTable = pgTable("alert_channels", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  config: jsonb("config").notNull().default({}),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertAlertChannelSchema = createInsertSchema(
  alertChannelsTable
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlertChannel = z.infer<typeof insertAlertChannelSchema>;
export type AlertChannel = typeof alertChannelsTable.$inferSelect;
