import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { monitorsTable } from "./monitors";

export const incidentsTable = pgTable(
  "incidents",
  {
    id: serial("id").primaryKey(),
    monitorId: integer("monitor_id")
      .notNull()
      .references(() => monitorsTable.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    rootCause: text("root_cause"),
    affectedRegions: text("affected_regions").array().notNull().default([]),
    isAcknowledged: boolean("is_acknowledged").notNull().default(false),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("incidents_monitor_id_started_at_idx").on(
      table.monitorId,
      table.startedAt,
    ),
    index("incidents_monitor_id_idx").on(table.monitorId),
    index("incidents_resolved_at_idx").on(table.resolvedAt),
  ],
);

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidentsTable.$inferSelect;
