import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  monitorsTable,
  alertChannelsTable,
  monitorAlertChannelsTable,
} from "@workspace/db";
import { requireAuth } from "../../middlewares/requireAuth";

const router: IRouter = Router();

function formatChannel(c: typeof alertChannelsTable.$inferSelect) {
  return {
    id: String(c.id),
    type: c.type,
    name: c.name,
    config: c.config as Record<string, unknown>,
    isVerified: c.isVerified,
    createdAt: c.createdAt,
  };
}

router.get(
  "/monitors/:id/alert-channels",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const monitorId = Number(req.params.id);
    if (!monitorId) { res.status(400).json({ error: "Invalid id" }); return; }

    const [monitor] = await db
      .select({ id: monitorsTable.id })
      .from(monitorsTable)
      .where(and(eq(monitorsTable.id, monitorId), eq(monitorsTable.userId, userId)));

    if (!monitor) { res.status(404).json({ error: "Monitor not found" }); return; }

    const rows = await db
      .select({ channel: alertChannelsTable })
      .from(monitorAlertChannelsTable)
      .innerJoin(alertChannelsTable, eq(monitorAlertChannelsTable.alertChannelId, alertChannelsTable.id))
      .where(eq(monitorAlertChannelsTable.monitorId, monitorId));

    res.json(rows.map((r) => formatChannel(r.channel)));
  },
);

router.post(
  "/monitors/:id/alert-channels",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const monitorId = Number(req.params.id);
    if (!monitorId) { res.status(400).json({ error: "Invalid id" }); return; }

    const alertChannelId = Number(req.body?.alertChannelId);
    if (!alertChannelId) { res.status(400).json({ error: "alertChannelId is required" }); return; }

    const [monitor] = await db
      .select({ id: monitorsTable.id })
      .from(monitorsTable)
      .where(and(eq(monitorsTable.id, monitorId), eq(monitorsTable.userId, userId)));

    if (!monitor) { res.status(404).json({ error: "Monitor not found" }); return; }

    const [channel] = await db
      .select()
      .from(alertChannelsTable)
      .where(and(eq(alertChannelsTable.id, alertChannelId), eq(alertChannelsTable.userId, userId)));

    if (!channel) { res.status(404).json({ error: "Alert channel not found" }); return; }

    await db
      .insert(monitorAlertChannelsTable)
      .values({ monitorId, alertChannelId })
      .onConflictDoNothing();

    res.status(201).json(formatChannel(channel));
  },
);

router.delete(
  "/monitors/:id/alert-channels/:channelId",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const monitorId = Number(req.params.id);
    const alertChannelId = Number(req.params.channelId);
    if (!monitorId || !alertChannelId) { res.status(400).json({ error: "Invalid params" }); return; }

    const [monitor] = await db
      .select({ id: monitorsTable.id })
      .from(monitorsTable)
      .where(and(eq(monitorsTable.id, monitorId), eq(monitorsTable.userId, userId)));

    if (!monitor) { res.status(404).json({ error: "Monitor not found" }); return; }

    await db
      .delete(monitorAlertChannelsTable)
      .where(
        and(
          eq(monitorAlertChannelsTable.monitorId, monitorId),
          eq(monitorAlertChannelsTable.alertChannelId, alertChannelId),
        ),
      );

    res.sendStatus(204);
  },
);

export default router;
