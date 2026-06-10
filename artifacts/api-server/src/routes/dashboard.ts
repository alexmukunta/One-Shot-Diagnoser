import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { eq, and, gte, sql, count } from "drizzle-orm";
import { db } from "@workspace/db";
import { monitorsTable, monitorChecksTable, incidentsTable, monitorTagsTable, tagsTable } from "@workspace/db";
import { GetDashboardResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;

  const monitors = await db
    .select()
    .from(monitorsTable)
    .where(eq(monitorsTable.userId, userId));

  const monitorIds = monitors.map((m) => m.id);

  const summary = {
    total: monitors.length,
    up: monitors.filter((m) => m.isActive && m.lastStatus === "up").length,
    down: monitors.filter((m) => m.isActive && m.lastStatus === "down").length,
    paused: monitors.filter((m) => !m.isActive).length,
    degraded: monitors.filter((m) => m.isActive && m.lastStatus === "degraded").length,
  };

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const tagsByMonitor: Record<number, { id: string; name: string; color: string }[]> = {};
  if (monitorIds.length > 0) {
    const tags = await db
      .select({
        monitorId: monitorTagsTable.monitorId,
        tagId: tagsTable.id,
        tagName: tagsTable.name,
        tagColor: tagsTable.color,
      })
      .from(monitorTagsTable)
      .innerJoin(tagsTable, eq(tagsTable.id, monitorTagsTable.tagId))
      .where(sql`${monitorTagsTable.monitorId} = ANY(${sql.raw(`ARRAY[${monitorIds.join(",")}]::int[]`)})`)
      ;
    for (const t of tags) {
      if (!tagsByMonitor[t.monitorId]) tagsByMonitor[t.monitorId] = [];
      tagsByMonitor[t.monitorId].push({ id: String(t.tagId), name: t.tagName, color: t.tagColor });
    }
  }

  const monitorList = await Promise.all(
    monitors.map(async (m) => {
      const [checks24h, checks7d] = await Promise.all([
        db
          .select({ status: monitorChecksTable.status })
          .from(monitorChecksTable)
          .where(
            and(
              eq(monitorChecksTable.monitorId, m.id),
              gte(monitorChecksTable.checkedAt, since24h)
            )
          ),
        db
          .select({ status: monitorChecksTable.status })
          .from(monitorChecksTable)
          .where(
            and(
              eq(monitorChecksTable.monitorId, m.id),
              gte(monitorChecksTable.checkedAt, since7d)
            )
          ),
      ]);

      const uptime24h =
        checks24h.length > 0
          ? (checks24h.filter((c) => c.status === "up").length / checks24h.length) * 100
          : null;
      const uptime7d =
        checks7d.length > 0
          ? (checks7d.filter((c) => c.status === "up").length / checks7d.length) * 100
          : null;

      return {
        id: String(m.id),
        name: m.name,
        url: m.url,
        status: (!m.isActive ? "paused" : m.lastStatus ?? "unknown") as
          | "up"
          | "down"
          | "degraded"
          | "paused"
          | "unknown",
        uptime24h,
        uptime7d,
        lastResponseTimeMs: m.lastResponseTimeMs ?? null,
        lastCheckedAt: m.lastCheckedAt ?? null,
        tags: tagsByMonitor[m.id] ?? [],
      };
    })
  );

  const recentIncidents = await db
    .select({
      id: incidentsTable.id,
      monitorId: incidentsTable.monitorId,
      monitorName: monitorsTable.name,
      monitorUrl: monitorsTable.url,
      startedAt: incidentsTable.startedAt,
      resolvedAt: incidentsTable.resolvedAt,
      durationSeconds: incidentsTable.durationSeconds,
      rootCause: incidentsTable.rootCause,
      affectedRegions: incidentsTable.affectedRegions,
      isAcknowledged: incidentsTable.isAcknowledged,
      createdAt: incidentsTable.createdAt,
    })
    .from(incidentsTable)
    .innerJoin(monitorsTable, eq(monitorsTable.id, incidentsTable.monitorId))
    .where(eq(monitorsTable.userId, userId))
    .orderBy(sql`${incidentsTable.startedAt} DESC`)
    .limit(10);

  res.json(
    GetDashboardResponse.parse({
      summary,
      monitors: monitorList,
      recentIncidents: recentIncidents.map((i) => ({
        id: String(i.id),
        monitorId: String(i.monitorId),
        monitorName: i.monitorName,
        monitorUrl: i.monitorUrl,
        startedAt: i.startedAt,
        resolvedAt: i.resolvedAt,
        durationSeconds: i.durationSeconds,
        rootCause: i.rootCause,
        affectedRegions: i.affectedRegions,
        isAcknowledged: i.isAcknowledged,
        createdAt: i.createdAt,
      })),
    })
  );
});

export default router;
