import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { monitorsTable } from "./monitors";
import { alertChannelsTable } from "./alert_channels";

export const monitorAlertChannelsTable = pgTable(
  "monitor_alert_channels",
  {
    id: serial("id").primaryKey(),
    monitorId: integer("monitor_id")
      .notNull()
      .references(() => monitorsTable.id, { onDelete: "cascade" }),
    alertChannelId: integer("alert_channel_id")
      .notNull()
      .references(() => alertChannelsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.monitorId, t.alertChannelId)],
);

export type MonitorAlertChannel = typeof monitorAlertChannelsTable.$inferSelect;
