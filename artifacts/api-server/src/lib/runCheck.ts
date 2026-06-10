import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  monitorsTable,
  monitorChecksTable,
  incidentsTable,
  alertChannelsTable,
  monitorAlertChannelsTable,
} from "@workspace/db";
import { checkUrl } from "./checker";
import { dispatchAlerts } from "./notifier";
import { validateNoSsrf } from "./ssrf";
import { logger } from "./logger";

const SSL_EXPIRY_THRESHOLDS = [14, 7, 3];

async function getMonitorChannels(monitorId: number) {
  const rows = await db
    .select({ channel: alertChannelsTable })
    .from(monitorAlertChannelsTable)
    .innerJoin(
      alertChannelsTable,
      eq(monitorAlertChannelsTable.alertChannelId, alertChannelsTable.id),
    )
    .where(eq(monitorAlertChannelsTable.monitorId, monitorId));

  return rows.map((r) => ({
    id: String(r.channel.id),
    type: r.channel.type,
    name: r.channel.name,
    config: r.channel.config as Record<string, unknown>,
  }));
}

export async function runMonitorCheck(monitorId: number): Promise<void> {
  const [monitor] = await db
    .select()
    .from(monitorsTable)
    .where(eq(monitorsTable.id, monitorId));

  if (!monitor) {
    logger.warn({ monitorId }, "runMonitorCheck: monitor not found");
    return;
  }

  const previousStatus = monitor.lastStatus;

  // Get the most recent previous check for SSL threshold comparison
  const [prevCheck] = await db
    .select({ sslDaysRemaining: monitorChecksTable.sslDaysRemaining })
    .from(monitorChecksTable)
    .where(eq(monitorChecksTable.monitorId, monitorId))
    .orderBy(desc(monitorChecksTable.checkedAt))
    .limit(1);

  const prevSslDays = prevCheck?.sslDaysRemaining ?? null;

  let result;
  try {
    await validateNoSsrf(monitor.url);
    result = await checkUrl(
      monitor.url,
      monitor.timeoutSeconds * 1000,
      monitor.method,
      monitor.expectedStatus,
      monitor.keywordAssertion,
    );
  } catch (err) {
    logger.error({ err, monitorId }, "checkUrl threw unexpectedly");
    result = {
      status: "error" as const,
      httpStatus: null,
      responseTimeMs: null,
      errorMessage: (err as Error).message,
      sslValid: null,
      sslDaysRemaining: null,
    };
  }

  const checkStatus: "up" | "down" | "degraded" =
    result.status === "up" ? "up" : "down";

  await db.insert(monitorChecksTable).values({
    monitorId: monitor.id,
    status: checkStatus,
    responseTimeMs: result.responseTimeMs,
    statusCode: result.httpStatus,
    region: "us-east",
    error: result.errorMessage,
    sslValid: result.sslValid,
    sslDaysRemaining: result.sslDaysRemaining,
  });

  await db
    .update(monitorsTable)
    .set({
      lastStatus: checkStatus,
      lastCheckedAt: new Date(),
      lastResponseTimeMs: result.responseTimeMs,
    })
    .where(eq(monitorsTable.id, monitor.id));

  // SSL expiry alert: fire when crossing a threshold (14d, 7d, 3d)
  if (result.sslDaysRemaining !== null && result.sslDaysRemaining > 0) {
    const crossedThreshold = SSL_EXPIRY_THRESHOLDS.find((t) => {
      const nowBelow = result.sslDaysRemaining! <= t;
      const prevAbove = prevSslDays === null || prevSslDays > t;
      return nowBelow && prevAbove;
    });

    if (crossedThreshold !== undefined) {
      const channels = await getMonitorChannels(monitor.id);
      if (channels.length > 0) {
        logger.info({ monitorId, sslDaysRemaining: result.sslDaysRemaining, threshold: crossedThreshold }, "SSL expiry threshold crossed — sending alert");
        await dispatchAlerts(
          channels,
          { id: String(monitor.id), name: monitor.name, url: monitor.url },
          "ssl_expiry" as Parameters<typeof dispatchAlerts>[2],
          {
            id: "ssl",
            rootCause: `SSL certificate expires in ${result.sslDaysRemaining} day${result.sslDaysRemaining === 1 ? "" : "s"}`,
            startedAt: new Date(),
          },
        );
      }
    }
  }

  if (checkStatus === "down" && previousStatus !== "down") {
    const [incident] = await db
      .insert(incidentsTable)
      .values({
        monitorId: monitor.id,
        rootCause:
          result.errorMessage ?? `HTTP ${result.httpStatus ?? "error"}`,
        affectedRegions: ["us-east"],
      })
      .returning();

    if (incident && monitor.notifyOnDown) {
      const channels = await getMonitorChannels(monitor.id);
      if (channels.length > 0) {
        await dispatchAlerts(
          channels,
          { id: String(monitor.id), name: monitor.name, url: monitor.url },
          "down",
          {
            id: String(incident.id),
            rootCause: incident.rootCause,
            startedAt: incident.startedAt,
          },
        );
      } else {
        logger.debug({ monitorId }, "No alert channels assigned to monitor — skipping notifications");
      }
    }
  } else if (checkStatus === "up" && previousStatus === "down") {
    const [openIncident] = await db
      .select()
      .from(incidentsTable)
      .where(
        and(
          eq(incidentsTable.monitorId, monitor.id),
          sql`${incidentsTable.resolvedAt} IS NULL`,
        ),
      )
      .orderBy(desc(incidentsTable.startedAt))
      .limit(1);

    if (openIncident) {
      const durationSeconds = Math.floor(
        (Date.now() - openIncident.startedAt.getTime()) / 1000,
      );
      await db
        .update(incidentsTable)
        .set({ resolvedAt: new Date(), durationSeconds })
        .where(eq(incidentsTable.id, openIncident.id));

      if (monitor.notifyOnRecovery) {
        const channels = await getMonitorChannels(monitor.id);
        if (channels.length > 0) {
          await dispatchAlerts(
            channels,
            { id: String(monitor.id), name: monitor.name, url: monitor.url },
            "recovery",
            {
              id: String(openIncident.id),
              rootCause: openIncident.rootCause,
              startedAt: openIncident.startedAt,
            },
          );
        }
      }
    }
  }

  logger.debug({ monitorId, checkStatus, url: monitor.url }, "Monitor check complete");
}
