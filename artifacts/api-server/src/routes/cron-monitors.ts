import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { cronMonitorsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";
import { randomBytes } from "crypto";

const router: IRouter = Router();

function generateSlug(): string {
  return `cm-${randomBytes(5).toString("hex")}`;
}

function formatCronMonitor(m: typeof cronMonitorsTable.$inferSelect) {
  return {
    id: String(m.id),
    name: m.name,
    slug: m.slug,
    schedule: m.schedule ?? null,
    expectedIntervalSeconds: m.expectedIntervalSeconds,
    gracePeriodSeconds: m.gracePeriodSeconds,
    status: m.status,
    lastPingAt: m.lastPingAt ?? null,
    isActive: m.isActive,
    notifyOnDown: m.notifyOnDown,
    createdAt: m.createdAt,
  };
}

router.get("/cron-monitors", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const monitors = await db
    .select()
    .from(cronMonitorsTable)
    .where(eq(cronMonitorsTable.userId, userId))
    .orderBy(desc(cronMonitorsTable.createdAt));
  res.json(monitors.map(formatCronMonitor));
});

router.post("/cron-monitors", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const { name, schedule, expectedIntervalSeconds, gracePeriodSeconds, notifyOnDown } =
    req.body as Record<string, unknown>;

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (!expectedIntervalSeconds || typeof expectedIntervalSeconds !== "number" || expectedIntervalSeconds < 60) {
    res.status(400).json({ error: "expectedIntervalSeconds must be >= 60" });
    return;
  }

  let slug = generateSlug();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await db
      .select({ id: cronMonitorsTable.id })
      .from(cronMonitorsTable)
      .where(eq(cronMonitorsTable.slug, slug))
      .limit(1);
    if (existing.length === 0) break;
    slug = generateSlug();
    attempts++;
  }

  const [monitor] = await db
    .insert(cronMonitorsTable)
    .values({
      userId,
      name: name.trim(),
      slug,
      schedule: typeof schedule === "string" ? schedule.trim() || null : null,
      expectedIntervalSeconds,
      gracePeriodSeconds: typeof gracePeriodSeconds === "number" ? gracePeriodSeconds : 300,
      notifyOnDown: typeof notifyOnDown === "boolean" ? notifyOnDown : true,
    })
    .returning();

  res.status(201).json(formatCronMonitor(monitor!));
});

router.get(
  "/cron-monitors/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const [monitor] = await db
      .select()
      .from(cronMonitorsTable)
      .where(
        and(
          eq(cronMonitorsTable.id, Number(req.params.id)),
          eq(cronMonitorsTable.userId, userId),
        ),
      );
    if (!monitor) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(formatCronMonitor(monitor));
  },
);

router.delete(
  "/cron-monitors/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    await db
      .delete(cronMonitorsTable)
      .where(
        and(
          eq(cronMonitorsTable.id, Number(req.params.id)),
          eq(cronMonitorsTable.userId, userId),
        ),
      );
    res.sendStatus(204);
  },
);

// Public ping endpoint — called by the user's cron job
router.post("/cron/:slug/ping", async (req, res): Promise<void> => {
  const { slug } = req.params;
  const [monitor] = await db
    .select()
    .from(cronMonitorsTable)
    .where(eq(cronMonitorsTable.slug, slug))
    .limit(1);

  if (!monitor) {
    res.status(404).json({ error: "Cron monitor not found" });
    return;
  }

  if (!monitor.isActive) {
    res.json({ ok: true, message: "Monitor is paused" });
    return;
  }

  const wasDown = monitor.status === "down";
  await db
    .update(cronMonitorsTable)
    .set({ lastPingAt: new Date(), status: "up" })
    .where(eq(cronMonitorsTable.id, monitor.id));

  if (wasDown) {
    logger.info({ monitorId: monitor.id, slug }, "Cron monitor recovered");
  }

  logger.debug({ monitorId: monitor.id, slug }, "Cron monitor ping received");
  res.json({ ok: true, message: "Ping received" });
});

// Scheduler-callable: check for missed pings
export async function checkMissedCronPings(): Promise<void> {
  const overdue = await db
    .select()
    .from(cronMonitorsTable)
    .where(
      and(
        eq(cronMonitorsTable.isActive, true),
        sql`${cronMonitorsTable.status} != 'down'`,
        sql`${cronMonitorsTable.lastPingAt} IS NOT NULL`,
        sql`${cronMonitorsTable.lastPingAt} + (${cronMonitorsTable.expectedIntervalSeconds} + ${cronMonitorsTable.gracePeriodSeconds}) * interval '1 second' < now()`,
      ),
    );

  for (const monitor of overdue) {
    logger.info(
      { monitorId: monitor.id, slug: monitor.slug, lastPingAt: monitor.lastPingAt },
      "Cron monitor missed ping — marking down",
    );
    await db
      .update(cronMonitorsTable)
      .set({ status: "down" })
      .where(eq(cronMonitorsTable.id, monitor.id));
  }

  if (overdue.length > 0) {
    logger.info({ count: overdue.length }, "Cron monitor: marked missed as down");
  }
}

export default router;
