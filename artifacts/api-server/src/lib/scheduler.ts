import { eq, and, isNull, or, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { monitorsTable } from "@workspace/db";
import { runMonitorCheck } from "./runCheck";
import { checkMissedCronPings } from "../routes/cron-monitors";
import { logger } from "./logger";

const TICK_INTERVAL_MS = 30_000;

let running = false;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const now = new Date();
    const due = await db
      .select({ id: monitorsTable.id })
      .from(monitorsTable)
      .where(
        and(
          eq(monitorsTable.isActive, true),
          or(
            isNull(monitorsTable.lastCheckedAt),
            sql`${monitorsTable.lastCheckedAt} + (${monitorsTable.intervalSeconds} * interval '1 second') <= ${now}`,
          ),
        ),
      );

    if (due.length > 0) {
      logger.info({ count: due.length }, "Scheduler: running due checks");
      await Promise.allSettled(due.map((m) => runMonitorCheck(m.id)));
    }

    await checkMissedCronPings();
  } catch (err) {
    logger.error({ err }, "Scheduler tick error");
  } finally {
    running = false;
  }
}

export function startScheduler(): void {
  logger.info("Scheduler: starting");
  void tick();
  setInterval(() => void tick(), TICK_INTERVAL_MS);
}
