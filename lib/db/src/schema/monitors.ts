import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const monitorStatusEnum = pgEnum("monitor_status", [
  "up",
  "down",
  "degraded",
]);

export const monitorsTable = pgTable("monitors", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  method: text("method").notNull().default("GET"),
  intervalSeconds: integer("interval_seconds").notNull().default(300),
  timeoutSeconds: integer("timeout_seconds").notNull().default(30),
  expectedStatus: integer("expected_status").notNull().default(200),
  keywordAssertion: text("keyword_assertion"),
  isActive: boolean("is_active").notNull().default(true),
  lastStatus: monitorStatusEnum("last_status"),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  lastResponseTimeMs: integer("last_response_time_ms"),
  notifyOnDown: boolean("notify_on_down").notNull().default(true),
  notifyOnRecovery: boolean("notify_on_recovery").notNull().default(true),
  regions: text("regions").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertMonitorSchema = createInsertSchema(monitorsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastStatus: true,
  lastCheckedAt: true,
  lastResponseTimeMs: true,
});
export type InsertMonitor = z.infer<typeof insertMonitorSchema>;
export type Monitor = typeof monitorsTable.$inferSelect;
