import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { eq, and, gte, desc, sql, asc, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  monitorsTable,
  monitorChecksTable,
  incidentsTable,
  monitorTagsTable,
  tagsTable,
} from "@workspace/db";
import { runMonitorCheck } from "../../lib/runCheck";
import {
  ListMonitorsQueryParams,
  ListMonitorsResponse,
  CreateMonitorBody,
  GetMonitorParams,
  GetMonitorResponse,
  UpdateMonitorParams,
  UpdateMonitorBody,
  UpdateMonitorResponse,
  DeleteMonitorParams,
  PauseMonitorParams,
  PauseMonitorResponse,
  ResumeMonitorParams,
  ResumeMonitorResponse,
  TriggerMonitorCheckParams,
  TriggerMonitorCheckResponse,
  GetMonitorUptimeParams,
  GetMonitorUptimeQueryParams,
  GetMonitorUptimeResponse,
  GetMonitorTimeseriesParams,
  GetMonitorTimeseriesQueryParams,
  GetMonitorTimeseriesResponse,
  ListMonitorChecksParams,
  ListMonitorChecksQueryParams,
  ListMonitorChecksResponse,
  ListMonitorIncidentsParams,
  ListMonitorIncidentsResponse,
  AddTagToMonitorParams,
  AddTagToMonitorBody,
  AddTagToMonitorResponse,
  RemoveTagFromMonitorParams,
  RemoveTagFromMonitorResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../../middlewares/requireAuth";
import monitorAlertChannelsRouter from "./alert-channels";

const router: IRouter = Router();

router.use(monitorAlertChannelsRouter);

async function getMonitorTags(
  monitorId: number
): Promise<{ id: string; name: string; color: string }[]> {
  const tags = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      color: tagsTable.color,
    })
    .from(monitorTagsTable)
    .innerJoin(tagsTable, eq(tagsTable.id, monitorTagsTable.tagId))
    .where(eq(monitorTagsTable.monitorId, monitorId));
  return tags.map((t) => ({ id: String(t.id), name: t.name, color: t.color }));
}

async function getMonitorTagsBatch(
  monitorIds: number[]
): Promise<Map<number, { id: string; name: string; color: string }[]>> {
  if (monitorIds.length === 0) return new Map();
  const rows = await db
    .select({
      monitorId: monitorTagsTable.monitorId,
      id: tagsTable.id,
      name: tagsTable.name,
      color: tagsTable.color,
    })
    .from(monitorTagsTable)
    .innerJoin(tagsTable, eq(tagsTable.id, monitorTagsTable.tagId))
    .where(inArray(monitorTagsTable.monitorId, monitorIds));

  const map = new Map<number, { id: string; name: string; color: string }[]>();
  for (const row of rows) {
    const arr = map.get(row.monitorId) ?? [];
    arr.push({ id: String(row.id), name: row.name, color: row.color });
    map.set(row.monitorId, arr);
  }
  return map;
}

function parsePeriod(period: string): Date {
  const now = Date.now();
  const num = parseInt(period);
  if (period.endsWith("d")) return new Date(now - num * 24 * 60 * 60 * 1000);
  if (period.endsWith("h")) return new Date(now - num * 60 * 60 * 1000);
  return new Date(now - 30 * 24 * 60 * 60 * 1000);
}

function parseGranularityMs(granularity: string): number {
  const num = parseInt(granularity);
  if (granularity.endsWith("m")) return num * 60 * 1000;
  if (granularity.endsWith("h")) return num * 60 * 60 * 1000;
  if (granularity.endsWith("d")) return num * 24 * 60 * 60 * 1000;
  return 5 * 60 * 1000;
}

function formatMonitor(m: typeof monitorsTable.$inferSelect, tags: { id: string; name: string; color: string }[]) {
  return {
    id: String(m.id),
    name: m.name,
    url: m.url,
    method: m.method as "GET" | "POST" | "HEAD",
    intervalSeconds: m.intervalSeconds,
    timeoutSeconds: m.timeoutSeconds,
    expectedStatus: m.expectedStatus,
    keywordAssert: m.keywordAssertion,
    regions: m.regions,
    isActive: m.isActive,
    notifyOnDown: m.notifyOnDown,
    notifyOnRecovery: m.notifyOnRecovery,
    lastCheckedAt: m.lastCheckedAt,
    lastStatus: m.lastStatus,
    tags,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

router.get("/monitors", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const qp = ListMonitorsQueryParams.safeParse(req.query);

  const monitors = await db
    .select()
    .from(monitorsTable)
    .where(eq(monitorsTable.userId, userId))
    .orderBy(asc(monitorsTable.createdAt));

  const monitorIds = monitors.map((m) => m.id);
  const tagsByMonitor = await getMonitorTagsBatch(monitorIds);

  let filtered = monitors;
  if (qp.success && qp.data.tag) {
    const tagName = qp.data.tag;
    filtered = monitors.filter((m) =>
      (tagsByMonitor.get(m.id) ?? []).some((t) => t.name === tagName)
    );
  }

  const result = filtered.map((m) => formatMonitor(m, tagsByMonitor.get(m.id) ?? []));
  res.json(ListMonitorsResponse.parse(result));
});

router.post("/monitors", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const parsed = CreateMonitorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [monitor] = await db
    .insert(monitorsTable)
    .values({
      userId,
      name: parsed.data.name,
      url: parsed.data.url,
      method: parsed.data.method,
      intervalSeconds: parsed.data.intervalSeconds,
      timeoutSeconds: parsed.data.timeoutSeconds,
      expectedStatus: parsed.data.expectedStatus,
      keywordAssertion: parsed.data.keywordAssert,
      regions: parsed.data.regions ?? [],
      notifyOnDown: parsed.data.notifyOnDown,
      notifyOnRecovery: parsed.data.notifyOnRecovery,
    })
    .returning();

  res.status(201).json(GetMonitorResponse.parse(formatMonitor(monitor!, [])));
});

router.get("/monitors/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const params = GetMonitorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [monitor] = await db
    .select()
    .from(monitorsTable)
    .where(
      and(
        eq(monitorsTable.id, Number(params.data.id)),
        eq(monitorsTable.userId, userId)
      )
    );

  if (!monitor) {
    res.status(404).json({ error: "Monitor not found" });
    return;
  }

  const tags = await getMonitorTags(monitor.id);
  res.json(GetMonitorResponse.parse(formatMonitor(monitor, tags)));
});

router.put("/monitors/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const params = UpdateMonitorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMonitorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Build update data explicitly using proper Drizzle column types
  const updateData: Partial<typeof monitorsTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.url !== undefined) updateData.url = parsed.data.url;
  if (parsed.data.method !== undefined) updateData.method = parsed.data.method;
  if (parsed.data.intervalSeconds !== undefined) updateData.intervalSeconds = parsed.data.intervalSeconds;
  if (parsed.data.timeoutSeconds !== undefined) updateData.timeoutSeconds = parsed.data.timeoutSeconds;
  if (parsed.data.expectedStatus !== undefined) updateData.expectedStatus = parsed.data.expectedStatus;
  if (parsed.data.keywordAssert !== undefined) updateData.keywordAssertion = parsed.data.keywordAssert;
  if (parsed.data.regions !== undefined) updateData.regions = parsed.data.regions;
  if (parsed.data.notifyOnDown !== undefined) updateData.notifyOnDown = parsed.data.notifyOnDown;
  if (parsed.data.notifyOnRecovery !== undefined) updateData.notifyOnRecovery = parsed.data.notifyOnRecovery;

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [monitor] = await db
    .update(monitorsTable)
    .set(updateData)
    .where(
      and(
        eq(monitorsTable.id, Number(params.data.id)),
        eq(monitorsTable.userId, userId)
      )
    )
    .returning();

  if (!monitor) {
    res.status(404).json({ error: "Monitor not found" });
    return;
  }

  const tags = await getMonitorTags(monitor.id);
  res.json(UpdateMonitorResponse.parse(formatMonitor(monitor, tags)));
});

router.delete("/monitors/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const params = DeleteMonitorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(monitorsTable)
    .where(
      and(
        eq(monitorsTable.id, Number(params.data.id)),
        eq(monitorsTable.userId, userId)
      )
    );

  res.sendStatus(204);
});

router.post(
  "/monitors/:id/pause",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = PauseMonitorParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [monitor] = await db
      .update(monitorsTable)
      .set({ isActive: false })
      .where(
        and(
          eq(monitorsTable.id, Number(params.data.id)),
          eq(monitorsTable.userId, userId)
        )
      )
      .returning();

    if (!monitor) {
      res.status(404).json({ error: "Monitor not found" });
      return;
    }

    const tags = await getMonitorTags(monitor.id);
    res.json(PauseMonitorResponse.parse(formatMonitor(monitor, tags)));
  }
);

router.post(
  "/monitors/:id/resume",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = ResumeMonitorParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [monitor] = await db
      .update(monitorsTable)
      .set({ isActive: true })
      .where(
        and(
          eq(monitorsTable.id, Number(params.data.id)),
          eq(monitorsTable.userId, userId)
        )
      )
      .returning();

    if (!monitor) {
      res.status(404).json({ error: "Monitor not found" });
      return;
    }

    const tags = await getMonitorTags(monitor.id);
    res.json(ResumeMonitorResponse.parse(formatMonitor(monitor, tags)));
  }
);

router.post(
  "/monitors/:id/check",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = TriggerMonitorCheckParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const monitorId = Number(params.data.id);

    const [monitor] = await db
      .select()
      .from(monitorsTable)
      .where(
        and(
          eq(monitorsTable.id, monitorId),
          eq(monitorsTable.userId, userId)
        )
      );

    if (!monitor) {
      res.status(404).json({ error: "Monitor not found" });
      return;
    }

    await runMonitorCheck(monitorId);

    const [check] = await db
      .select()
      .from(monitorChecksTable)
      .where(eq(monitorChecksTable.monitorId, monitorId))
      .orderBy(desc(monitorChecksTable.checkedAt))
      .limit(1);

    if (!check) {
      res.status(500).json({ error: "Check completed but no result stored" });
      return;
    }

    res.json(
      TriggerMonitorCheckResponse.parse({
        id: String(check.id),
        monitorId: String(check.monitorId),
        region: check.region ?? "us-east",
        status: check.status === "down" ? "down" : "up",
        httpStatus: check.statusCode,
        responseTimeMs: check.responseTimeMs,
        errorMessage: check.error,
        checkedAt: check.checkedAt,
      })
    );
  }
);

router.get(
  "/monitors/:id/uptime",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = GetMonitorUptimeParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const qp = GetMonitorUptimeQueryParams.safeParse(req.query);
    const period = qp.success ? (qp.data.period ?? "30d") : "30d";

    const [monitor] = await db
      .select()
      .from(monitorsTable)
      .where(
        and(
          eq(monitorsTable.id, Number(params.data.id)),
          eq(monitorsTable.userId, userId)
        )
      );

    if (!monitor) {
      res.status(404).json({ error: "Monitor not found" });
      return;
    }

    const since = parsePeriod(period);
    const checks = await db
      .select()
      .from(monitorChecksTable)
      .where(
        and(
          eq(monitorChecksTable.monitorId, monitor.id),
          gte(monitorChecksTable.checkedAt, since)
        )
      );

    const total = checks.length;
    const down = checks.filter((c) => c.status === "down").length;
    const uptime = total > 0 ? ((total - down) / total) * 100 : 100;
    const avgResponse =
      total > 0
        ? checks.reduce((sum, c) => sum + (c.responseTimeMs ?? 0), 0) / total
        : null;

    const sortedTimes = checks
      .map((c) => c.responseTimeMs)
      .filter(Boolean)
      .sort((a, b) => a! - b!) as number[];
    const p95 =
      sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length * 0.95)] ?? null
        : null;

    const incidentsInPeriod = await db
      .select({ id: incidentsTable.id, startedAt: incidentsTable.startedAt, durationSeconds: incidentsTable.durationSeconds })
      .from(incidentsTable)
      .where(
        and(
          eq(incidentsTable.monitorId, monitor.id),
          gte(incidentsTable.startedAt, since)
        )
      );

    const totalDowntimeMinutes = incidentsInPeriod.reduce(
      (sum, i) => sum + Math.floor((i.durationSeconds ?? 0) / 60),
      0
    );

    res.json(
      GetMonitorUptimeResponse.parse({
        period,
        uptimePercent: uptime,
        totalChecks: total,
        downChecks: down,
        avgResponseTimeMs: avgResponse,
        p95ResponseTimeMs: p95,
        incidentsCount: incidentsInPeriod.length,
        totalDowntimeMinutes,
      })
    );
  }
);

router.get(
  "/monitors/:id/timeseries",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = GetMonitorTimeseriesParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const qp = GetMonitorTimeseriesQueryParams.safeParse(req.query);
    const period = qp.success ? (qp.data.period ?? "24h") : "24h";
    const granularity = qp.success ? (qp.data.granularity ?? "5m") : "5m";

    const [monitor] = await db
      .select()
      .from(monitorsTable)
      .where(
        and(
          eq(monitorsTable.id, Number(params.data.id)),
          eq(monitorsTable.userId, userId)
        )
      );

    if (!monitor) {
      res.status(404).json({ error: "Monitor not found" });
      return;
    }

    const since = parsePeriod(period);
    const granMs = parseGranularityMs(granularity);

    const checks = await db
      .select()
      .from(monitorChecksTable)
      .where(
        and(
          eq(monitorChecksTable.monitorId, monitor.id),
          gte(monitorChecksTable.checkedAt, since)
        )
      )
      .orderBy(asc(monitorChecksTable.checkedAt));

    const buckets = new Map<
      number,
      { responseTimes: number[]; statuses: string[] }
    >();

    for (const check of checks) {
      const bucket =
        Math.floor(check.checkedAt.getTime() / granMs) * granMs;
      if (!buckets.has(bucket)) {
        buckets.set(bucket, { responseTimes: [], statuses: [] });
      }
      const b = buckets.get(bucket)!;
      if (check.responseTimeMs) b.responseTimes.push(check.responseTimeMs);
      b.statuses.push(check.status);
    }

    const series = Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([ts, { responseTimes, statuses }]) => ({
        timestamp: new Date(ts),
        responseTimeMs:
          responseTimes.length > 0
            ? Math.round(
                responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
              )
            : null,
        status: (statuses.includes("down")
          ? "down"
          : statuses.includes("error")
            ? "error"
            : statuses.includes("timeout")
              ? "timeout"
              : "up") as "up" | "down" | "timeout" | "error",
      }));

    res.json(
      GetMonitorTimeseriesResponse.parse({
        monitorId: String(monitor.id),
        period,
        granularity,
        series,
      })
    );
  }
);

router.get(
  "/monitors/:id/checks",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = ListMonitorChecksParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const qp = ListMonitorChecksQueryParams.safeParse(req.query);
    const limit = qp.success ? (qp.data.limit ?? 50) : 50;

    const [monitor] = await db
      .select()
      .from(monitorsTable)
      .where(
        and(
          eq(monitorsTable.id, Number(params.data.id)),
          eq(monitorsTable.userId, userId)
        )
      );

    if (!monitor) {
      res.status(404).json({ error: "Monitor not found" });
      return;
    }

    const checks = await db
      .select()
      .from(monitorChecksTable)
      .where(eq(monitorChecksTable.monitorId, monitor.id))
      .orderBy(desc(monitorChecksTable.checkedAt))
      .limit(limit);

    res.json(
      ListMonitorChecksResponse.parse(
        checks.map((c) => ({
          id: String(c.id),
          monitorId: String(c.monitorId),
          region: c.region ?? "us-east",
          status:
            c.status === "down"
              ? "down"
              : c.status === "degraded"
                ? "down"
                : "up",
          httpStatus: c.statusCode,
          responseTimeMs: c.responseTimeMs,
          errorMessage: c.error,
          checkedAt: c.checkedAt,
        }))
      )
    );
  }
);

router.get(
  "/monitors/:id/incidents",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = ListMonitorIncidentsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [monitor] = await db
      .select()
      .from(monitorsTable)
      .where(
        and(
          eq(monitorsTable.id, Number(params.data.id)),
          eq(monitorsTable.userId, userId)
        )
      );

    if (!monitor) {
      res.status(404).json({ error: "Monitor not found" });
      return;
    }

    const incidents = await db
      .select()
      .from(incidentsTable)
      .where(eq(incidentsTable.monitorId, monitor.id))
      .orderBy(desc(incidentsTable.startedAt))
      .limit(50);

    res.json(
      ListMonitorIncidentsResponse.parse(
        incidents.map((i) => ({
          id: String(i.id),
          monitorId: String(i.monitorId),
          monitorName: monitor.name,
          monitorUrl: monitor.url,
          startedAt: i.startedAt,
          resolvedAt: i.resolvedAt,
          durationSeconds: i.durationSeconds,
          rootCause: i.rootCause,
          affectedRegions: i.affectedRegions,
          isAcknowledged: i.isAcknowledged,
          createdAt: i.createdAt,
        }))
      )
    );
  }
);

router.post(
  "/monitors/:id/tags",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = AddTagToMonitorParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = AddTagToMonitorBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [monitor] = await db
      .select()
      .from(monitorsTable)
      .where(
        and(
          eq(monitorsTable.id, Number(params.data.id)),
          eq(monitorsTable.userId, userId)
        )
      );

    if (!monitor) {
      res.status(404).json({ error: "Monitor not found" });
      return;
    }

    // Verify the tag belongs to the same user (prevents cross-user tag association)
    const [tag] = await db
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(
        and(
          eq(tagsTable.id, Number(parsed.data.tagId)),
          eq(tagsTable.userId, userId)
        )
      );

    if (!tag) {
      res.status(404).json({ error: "Tag not found" });
      return;
    }

    await db
      .insert(monitorTagsTable)
      .values({ monitorId: monitor.id, tagId: tag.id })
      .onConflictDoNothing();

    const tags = await getMonitorTags(monitor.id);
    res.json(AddTagToMonitorResponse.parse(formatMonitor(monitor, tags)));
  }
);

router.delete(
  "/monitors/:id/tags/:tagId",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = RemoveTagFromMonitorParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [monitor] = await db
      .select()
      .from(monitorsTable)
      .where(
        and(
          eq(monitorsTable.id, Number(params.data.id)),
          eq(monitorsTable.userId, userId)
        )
      );

    if (!monitor) {
      res.status(404).json({ error: "Monitor not found" });
      return;
    }

    await db
      .delete(monitorTagsTable)
      .where(
        and(
          eq(monitorTagsTable.monitorId, monitor.id),
          eq(monitorTagsTable.tagId, Number(params.data.tagId))
        )
      );

    const tags = await getMonitorTags(monitor.id);
    res.json(RemoveTagFromMonitorResponse.parse(formatMonitor(monitor, tags)));
  }
);

export default router;
