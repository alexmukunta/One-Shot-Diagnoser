import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cronMonitorStatusEnum = pgEnum("cron_monitor_status", [
  "up",
  "down",
  "pending",
]);

export const cronMonitorsTable = pgTable(
  "cron_monitors",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    schedule: text("schedule"),
    expectedIntervalSeconds: integer("expected_interval_seconds").notNull(),
    gracePeriodSeconds: integer("grace_period_seconds").notNull().default(300),
    lastPingAt: timestamp("last_ping_at", { withTimezone: true }),
    status: cronMonitorStatusEnum("status").notNull().default("pending"),
    isActive: boolean("is_active").notNull().default(true),
    notifyOnDown: boolean("notify_on_down").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("cron_monitors_user_id_idx").on(table.userId),
    index("cron_monitors_slug_idx").on(table.slug),
    index("cron_monitors_user_id_is_active_idx").on(
      table.userId,
      table.isActive,
    ),
  ],
);

export const insertCronMonitorSchema = createInsertSchema(
  cronMonitorsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  lastPingAt: true,
});
export type InsertCronMonitor = z.infer<typeof insertCronMonitorSchema>;
export type CronMonitor = typeof cronMonitorsTable.$inferSelect;
