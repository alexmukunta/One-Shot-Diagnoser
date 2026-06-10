import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { incidentsTable, monitorsTable } from "@workspace/db";
import {
  ListIncidentsQueryParams,
  GetIncidentParams,
  AcknowledgeIncidentParams,
  ListIncidentsResponse,
  GetIncidentResponse,
  AcknowledgeIncidentResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/incidents", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const qp = ListIncidentsQueryParams.safeParse(req.query);
  const page = qp.success ? (qp.data.page ?? 1) : 1;
  const limit = qp.success ? (qp.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const [items, totalRows] = await Promise.all([
    db
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
      .orderBy(desc(incidentsTable.startedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(incidentsTable)
      .innerJoin(monitorsTable, eq(monitorsTable.id, incidentsTable.monitorId))
      .where(eq(monitorsTable.userId, userId)),
  ]);

  const total = Number(totalRows[0]?.count ?? 0);

  res.json(
    ListIncidentsResponse.parse({
      items: items.map((i) => ({
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
      total,
      page,
      limit,
    })
  );
});

router.get("/incidents/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const params = GetIncidentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [incident] = await db
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
    .where(
      and(
        eq(incidentsTable.id, Number(params.data.id)),
        eq(monitorsTable.userId, userId)
      )
    );

  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  res.json(
    GetIncidentResponse.parse({
      id: String(incident.id),
      monitorId: String(incident.monitorId),
      monitorName: incident.monitorName,
      monitorUrl: incident.monitorUrl,
      startedAt: incident.startedAt,
      resolvedAt: incident.resolvedAt,
      durationSeconds: incident.durationSeconds,
      rootCause: incident.rootCause,
      affectedRegions: incident.affectedRegions,
      isAcknowledged: incident.isAcknowledged,
      createdAt: incident.createdAt,
    })
  );
});

router.post(
  "/incidents/:id/acknowledge",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = AcknowledgeIncidentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [existing] = await db
      .select({ id: incidentsTable.id, monitorId: incidentsTable.monitorId })
      .from(incidentsTable)
      .innerJoin(monitorsTable, eq(monitorsTable.id, incidentsTable.monitorId))
      .where(
        and(
          eq(incidentsTable.id, Number(params.data.id)),
          eq(monitorsTable.userId, userId)
        )
      );

    if (!existing) {
      res.status(404).json({ error: "Incident not found" });
      return;
    }

    const [updated] = await db
      .update(incidentsTable)
      .set({ isAcknowledged: true, acknowledgedAt: new Date() })
      .where(eq(incidentsTable.id, Number(params.data.id)))
      .returning();

    const [mon] = await db
      .select({ name: monitorsTable.name, url: monitorsTable.url })
      .from(monitorsTable)
      .where(eq(monitorsTable.id, updated!.monitorId));

    res.json(
      AcknowledgeIncidentResponse.parse({
        id: String(updated!.id),
        monitorId: String(updated!.monitorId),
        monitorName: mon?.name,
        monitorUrl: mon?.url,
        startedAt: updated!.startedAt,
        resolvedAt: updated!.resolvedAt,
        durationSeconds: updated!.durationSeconds,
        rootCause: updated!.rootCause,
        affectedRegions: updated!.affectedRegions,
        isAcknowledged: updated!.isAcknowledged,
        createdAt: updated!.createdAt,
      })
    );
  }
);

export default router;
