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
import { monitorsTable } from "./monitors";

export const checkStatusEnum = pgEnum("check_status", [
  "up",
  "down",
  "degraded",
]);

export const monitorChecksTable = pgTable("monitor_checks", {
  id: serial("id").primaryKey(),
  monitorId: integer("monitor_id")
    .notNull()
    .references(() => monitorsTable.id, { onDelete: "cascade" }),
  status: checkStatusEnum("status").notNull(),
  responseTimeMs: integer("response_time_ms"),
  statusCode: integer("status_code"),
  region: text("region"),
  error: text("error"),
  sslValid: boolean("ssl_valid"),
  sslDaysRemaining: integer("ssl_days_remaining"),
  checkedAt: timestamp("checked_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertMonitorCheckSchema = createInsertSchema(
  monitorChecksTable
).omit({ id: true, checkedAt: true });
export type InsertMonitorCheck = z.infer<typeof insertMonitorCheckSchema>;
export type MonitorCheck = typeof monitorChecksTable.$inferSelect;
