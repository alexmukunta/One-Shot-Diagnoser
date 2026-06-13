import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  alertChannelsTable,
  monitorAlertChannelsTable,
  monitorsTable,
  monitorChecksTable,
} from "@workspace/db";
import { dispatchAlerts, sendTestNotification } from "../lib/notifier";
import { runMonitorCheck } from "../lib/runCheck";
import {
  CreateAlertChannelBody,
  UpdateAlertChannelParams,
  UpdateAlertChannelBody,
  DeleteAlertChannelParams,
  TestAlertChannelParams,
  ListAlertChannelsResponse,
  UpdateAlertChannelResponse,
  TestAlertChannelResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/alert-channels", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const channels = await db
    .select()
    .from(alertChannelsTable)
    .where(eq(alertChannelsTable.userId, userId))
    .orderBy(alertChannelsTable.createdAt);

  res.json(
    ListAlertChannelsResponse.parse(
      channels.map((c) => ({
        id: String(c.id),
        type: c.type,
        name: c.name,
        config: c.config as Record<string, unknown>,
        isVerified: c.isVerified,
        createdAt: c.createdAt,
      }))
    )
  );
});

router.post("/alert-channels", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId as string;
  const parsed = CreateAlertChannelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [channel] = await db
    .insert(alertChannelsTable)
    .values({
      userId,
      type: parsed.data.type,
      name: parsed.data.name,
      config: parsed.data.config,
    })
    .returning();

  res.status(201).json({
    id: String(channel!.id),
    type: channel!.type,
    name: channel!.name,
    config: channel!.config as Record<string, unknown>,
    isVerified: channel!.isVerified,
    createdAt: channel!.createdAt,
  });
});

router.patch(
  "/alert-channels/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = UpdateAlertChannelParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateAlertChannelBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [channel] = await db
      .update(alertChannelsTable)
      .set(parsed.data)
      .where(
        and(
          eq(alertChannelsTable.id, Number(params.data.id)),
          eq(alertChannelsTable.userId, userId)
        )
      )
      .returning();

    if (!channel) {
      res.status(404).json({ error: "Alert channel not found" });
      return;
    }

    res.json(
      UpdateAlertChannelResponse.parse({
        id: String(channel.id),
        type: channel.type,
        name: channel.name,
        config: channel.config as Record<string, unknown>,
        isVerified: channel.isVerified,
        createdAt: channel.createdAt,
      })
    );
  }
);

router.delete(
  "/alert-channels/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = DeleteAlertChannelParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    await db
      .delete(alertChannelsTable)
      .where(
        and(
          eq(alertChannelsTable.id, Number(params.data.id)),
          eq(alertChannelsTable.userId, userId)
        )
      );

    res.sendStatus(204);
  }
);

router.post(
  "/alert-channels/:id/test",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuth(req).userId as string;
    const params = TestAlertChannelParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [channel] = await db
      .select()
      .from(alertChannelsTable)
      .where(
        and(
          eq(alertChannelsTable.id, Number(params.data.id)),
          eq(alertChannelsTable.userId, userId)
        )
      );

    if (!channel) {
      res.status(404).json({ error: "Alert channel not found" });
      return;
    }

    // Find a monitor that has this alert channel attached
    const [attachment] = await db
      .select({ monitor: monitorsTable })
      .from(monitorAlertChannelsTable)
      .innerJoin(monitorsTable, eq(monitorAlertChannelsTable.monitorId, monitorsTable.id))
      .where(
        and(
          eq(monitorAlertChannelsTable.alertChannelId, channel.id),
          eq(monitorsTable.userId, userId),
        )
      )
      .limit(1);

    const channelObj = {
      id: String(channel.id),
      type: channel.type,
      name: channel.name,
      config: channel.config as Record<string, unknown>,
    };

    try {
      if (attachment) {
        const monitor = attachment.monitor;
        logger.info(
          { channelId: channel.id, monitorId: monitor.id },
          "Alert channel test: running live check on attached monitor",
        );

        await runMonitorCheck(monitor.id);

        const [latestCheck] = await db
          .select()
          .from(monitorChecksTable)
          .where(eq(monitorChecksTable.monitorId, monitor.id))
          .orderBy(desc(monitorChecksTable.checkedAt))
          .limit(1);

        const checkStatus = latestCheck?.status ?? "up";
        const event = checkStatus === "down" || checkStatus === "degraded" ? "down" : "recovery";

        await sendTestNotification(
          channelObj,
          { id: String(monitor.id), name: monitor.name, url: monitor.url },
          {
            id: latestCheck ? String(latestCheck.id) : "test",
            rootCause:
              event === "down"
                ? (latestCheck?.error ?? "Test alert — monitor is currently down")
                : `[Test] Monitor is UP · response ${latestCheck?.responseTimeMs ?? "–"}ms`,
            startedAt: latestCheck?.checkedAt ?? new Date(),
          },
        );
      } else {
        await sendTestNotification(
          channelObj,
          { id: "0", name: "Example Monitor", url: "https://example.com" },
          {
            id: "0",
            rootCause: "This is a test alert from One Shot Diagnoser. Attach this channel to a monitor to receive real check data.",
            startedAt: new Date(),
          },
        );
      }

      res.json(TestAlertChannelResponse.parse({ success: true, message: "Test notification sent" }));
    } catch (err) {
      logger.error({ err, channelId: channel.id }, "Alert channel test failed");
      res.json(
        TestAlertChannelResponse.parse({ success: false, message: (err as Error).message })
      );
    }
  }
);

export default router;
