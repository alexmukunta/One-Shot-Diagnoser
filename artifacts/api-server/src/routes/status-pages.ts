import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  statusPagesTable,
  statusPageMonitorsTable,
  monitorsTable,
  monitorChecksTable,
  incidentsTable,
} from "@workspace/db";
import {
  CreateStatusPageBody,
  UpdateStatusPageParams,
  UpdateStatusPageBody,
  DeleteStatusPageParams,
  GetPublicStatusPageParams,
  ListStatusPagesResponse,
  UpdateStatusPageResponse,
  GetPublicStatusPageResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/status-pages", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const pages = await db
    .select()
    .from(statusPagesTable)
    .where(eq(statusPagesTable.userId, userId))
    .orderBy(statusPagesTable.createdAt);

  const result = await Promise.all(
    pages.map(async (p) => {
      const monitorLinks = await db
        .select({ monitorId: statusPageMonitorsTable.monitorId })
        .from(statusPageMonitorsTable)
        .where(eq(statusPageMonitorsTable.statusPageId, p.id))
        .orderBy(statusPageMonitorsTable.displayOrder);

      return {
        id: String(p.id),
        slug: p.slug,
        title: p.title,
        description: p.description,
        isPublic: p.isPublic,
        monitorIds: monitorLinks.map((l) => String(l.monitorId)),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    })
  );

  res.json(ListStatusPagesResponse.parse(result));
});

router.post("/status-pages", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const parsed = CreateStatusPageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let page: typeof statusPagesTable.$inferSelect;
  try {
    const [inserted] = await db
      .insert(statusPagesTable)
      .values({
        userId,
        slug: parsed.data.slug,
        title: parsed.data.title,
        description: parsed.data.description,
        isPublic: parsed.data.isPublic,
      })
      .returning();
    page = inserted!;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      res.status(409).json({ error: `The slug "${parsed.data.slug}" is already taken. Choose a different one.` });
      return;
    }
    throw err;
  }

  if (parsed.data.monitorIds && parsed.data.monitorIds.length > 0) {
    await db.insert(statusPageMonitorsTable).values(
      parsed.data.monitorIds.map((mid, idx) => ({
        statusPageId: page!.id,
        monitorId: Number(mid),
        displayOrder: idx,
      }))
    );
  }

  res.status(201).json({
    id: String(page!.id),
    slug: page!.slug,
    title: page!.title,
    description: page!.description,
    isPublic: page!.isPublic,
    monitorIds: parsed.data.monitorIds ?? [],
    createdAt: page!.createdAt,
    updatedAt: page!.updatedAt,
  });
});

router.patch(
  "/status-pages/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = UpdateStatusPageParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateStatusPageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { monitorIds, ...rest } = parsed.data;

    const [page] = await db
      .update(statusPagesTable)
      .set(rest)
      .where(
        and(
          eq(statusPagesTable.id, Number(params.data.id)),
          eq(statusPagesTable.userId, userId)
        )
      )
      .returning();

    if (!page) {
      res.status(404).json({ error: "Status page not found" });
      return;
    }

    if (monitorIds !== undefined) {
      await db
        .delete(statusPageMonitorsTable)
        .where(eq(statusPageMonitorsTable.statusPageId, page.id));

      if (monitorIds.length > 0) {
        await db.insert(statusPageMonitorsTable).values(
          monitorIds.map((mid, idx) => ({
            statusPageId: page.id,
            monitorId: Number(mid),
            displayOrder: idx,
          }))
        );
      }
    }

    const monitorLinks = await db
      .select({ monitorId: statusPageMonitorsTable.monitorId })
      .from(statusPageMonitorsTable)
      .where(eq(statusPageMonitorsTable.statusPageId, page.id))
      .orderBy(statusPageMonitorsTable.displayOrder);

    res.json(
      UpdateStatusPageResponse.parse({
        id: String(page.id),
        slug: page.slug,
        title: page.title,
        description: page.description,
        isPublic: page.isPublic,
        monitorIds: monitorLinks.map((l) => String(l.monitorId)),
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      })
    );
  }
);

router.delete(
  "/status-pages/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = DeleteStatusPageParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    await db
      .delete(statusPagesTable)
      .where(
        and(
          eq(statusPagesTable.id, Number(params.data.id)),
          eq(statusPagesTable.userId, userId)
        )
      );

    res.sendStatus(204);
  }
);

function buildDemoBar(daysAgo: number): "up" | "down" | "degraded" | "nodata" {
  if (daysAgo > 88) return "nodata";
  if (daysAgo === 14) return "down";
  if (daysAgo === 30 || daysAgo === 31) return "degraded";
  return "up";
}

function makeDemoDailyBars() {
  return Array.from({ length: 90 }, (_, i) => {
    const d = 89 - i;
    const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
    const status = buildDemoBar(d);
    return { date, status, uptime: status === "up" ? 100 : status === "degraded" ? 72 : status === "down" ? 0 : 100 };
  });
}

router.get("/public/status/demo", async (_req, res): Promise<void> => {
  const bars = makeDemoDailyBars();
  res.json({
    title: "Acme Corp — System Status",
    description: "Real-time uptime and incident information for all Acme services.",
    overallStatus: "operational",
    monitors: [
      {
        name: "API Gateway",
        status: "up",
        uptime90d: 99.91,
        dailyBars: bars,
      },
      {
        name: "Web App",
        status: "up",
        uptime90d: 99.98,
        dailyBars: bars.map((b) => ({ ...b, status: b.status === "down" ? "up" : b.status })),
      },
      {
        name: "Authentication Service",
        status: "up",
        uptime90d: 100,
        dailyBars: bars.map((b) => ({ ...b, status: b.status === "degraded" || b.status === "down" ? "up" : b.status })),
      },
      {
        name: "Database Cluster",
        status: "up",
        uptime90d: 99.87,
        dailyBars: bars.map((b, i) => ({ ...b, status: i === 59 ? "degraded" : b.status === "down" ? "up" : b.status })),
      },
      {
        name: "CDN / Edge",
        status: "up",
        uptime90d: 99.99,
        dailyBars: bars.map((b) => ({ ...b, status: b.status === "degraded" || b.status === "down" ? "up" : b.status })),
      },
    ],
    activeIncidents: [],
    recentIncidents: [],
  });
});

router.get("/public/status/:slug", async (req, res): Promise<void> => {
  const params = GetPublicStatusPageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [page] = await db
    .select()
    .from(statusPagesTable)
    .where(
      and(
        eq(statusPagesTable.slug, params.data.slug),
        eq(statusPagesTable.isPublic, true)
      )
    );

  if (!page) {
    res.status(404).json({ error: "Status page not found" });
    return;
  }

  const monitorLinks = await db
    .select({ monitorId: statusPageMonitorsTable.monitorId })
    .from(statusPageMonitorsTable)
    .where(eq(statusPageMonitorsTable.statusPageId, page.id))
    .orderBy(statusPageMonitorsTable.displayOrder);

  const monitorIds = monitorLinks.map((l) => l.monitorId);

  const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const monitorsData = await Promise.all(
    monitorIds.map(async (mid) => {
      const [mon] = await db
        .select()
        .from(monitorsTable)
        .where(eq(monitorsTable.id, mid));

      if (!mon) return null;

      const checks = await db
        .select({ status: monitorChecksTable.status, checkedAt: monitorChecksTable.checkedAt })
        .from(monitorChecksTable)
        .where(
          and(
            eq(monitorChecksTable.monitorId, mid),
            gte(monitorChecksTable.checkedAt, since90d)
          )
        );

      const uptime90d =
        checks.length > 0
          ? (checks.filter((c) => c.status === "up").length / checks.length) * 100
          : 100;

      const dailyMap: Record<string, { up: number; total: number }> = {};
      for (let d = 0; d < 90; d++) {
        const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
        const key = date.toISOString().split("T")[0]!;
        dailyMap[key] = { up: 0, total: 0 };
      }
      for (const c of checks) {
        const key = c.checkedAt.toISOString().split("T")[0]!;
        if (dailyMap[key]) {
          dailyMap[key]!.total++;
          if (c.status === "up") dailyMap[key]!.up++;
        }
      }

      const dailyBars = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, { up, total }]) => ({
          date,
          status:
            total === 0
              ? ("nodata" as const)
              : up === total
                ? ("up" as const)
                : up === 0
                  ? ("down" as const)
                  : ("degraded" as const),
          uptime: total === 0 ? 100 : (up / total) * 100,
        }));

      return {
        name: mon.name,
        status: (mon.isActive ? mon.lastStatus ?? "unknown" : "unknown") as
          | "up"
          | "down"
          | "degraded"
          | "unknown",
        uptime90d,
        dailyBars,
      };
    })
  );

  const validMonitors = monitorsData.filter(Boolean) as NonNullable<
    (typeof monitorsData)[number]
  >[];

  const activeIncidents = await db
    .select({
      id: incidentsTable.id,
      monitorId: incidentsTable.monitorId,
      monitorName: monitorsTable.name,
      startedAt: incidentsTable.startedAt,
      rootCause: incidentsTable.rootCause,
    })
    .from(incidentsTable)
    .innerJoin(monitorsTable, eq(monitorsTable.id, incidentsTable.monitorId))
    .where(sql`${incidentsTable.resolvedAt} IS NULL AND ${incidentsTable.monitorId} = ANY(${sql.raw(`ARRAY[${monitorIds.length > 0 ? monitorIds.join(",") : "NULL"}]::int[]`)})`)
    .orderBy(desc(incidentsTable.startedAt))
    .limit(5);

  const overallStatus: "operational" | "degraded" | "outage" =
    validMonitors.some((m) => m.status === "down")
      ? "outage"
      : validMonitors.some((m) => m.status === "degraded")
        ? "degraded"
        : "operational";

  res.json(
    GetPublicStatusPageResponse.parse({
      title: page.title,
      description: page.description,
      overallStatus,
      monitors: validMonitors,
      activeIncidents: activeIncidents.map((i) => ({
        id: String(i.id),
        monitorId: String(i.monitorId),
        monitorName: i.monitorName,
        startedAt: i.startedAt,
        rootCause: i.rootCause,
      })),
      recentIncidents: [],
    })
  );
});

export default router;
