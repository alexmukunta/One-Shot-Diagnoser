import { Resend } from "resend";
import { logger } from "./logger";

export interface AlertChannel {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
}

export interface MonitorInfo {
  id: string;
  name: string;
  url: string;
}

export interface IncidentInfo {
  id: string;
  rootCause: string | null;
  startedAt: Date;
}

export type AlertEvent = "down" | "recovery" | "ssl_expiry";

let resendClient: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

function statusEmoji(event: AlertEvent) {
  if (event === "down") return "🔴";
  if (event === "recovery") return "🟢";
  return "🔒";
}

function statusWord(event: AlertEvent) {
  if (event === "down") return "is DOWN";
  if (event === "recovery") return "has RECOVERED";
  return "SSL certificate expiring soon";
}

function buildEmailHtml(monitor: MonitorInfo, event: AlertEvent, incident: IncidentInfo): string {
  const isDown = event === "down";
  const isSsl = event === "ssl_expiry";
  const color = isDown ? "#ef4444" : isSsl ? "#f59e0b" : "#22c55e";
  const statusText = statusWord(event);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto">
    <tr>
      <td style="padding:32px;background:#161b22;border-radius:12px;border:1px solid #30363d">
        <div style="margin-bottom:24px">
          <span style="background:#1f2937;color:#9ca3af;font-size:12px;padding:4px 10px;border-radius:20px;border:1px solid #374151">URL Diagnostics</span>
        </div>
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${color}">
          ${statusEmoji(event)} ${monitor.name} ${statusText}
        </h1>
        <p style="margin:0 0 24px;color:#9ca3af;font-size:14px">${monitor.url}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;border-radius:8px;border:1px solid #30363d;margin-bottom:24px">
          <tr>
            <td style="padding:16px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#9ca3af;width:120px">Monitor</td>
                  <td style="padding:6px 0;font-size:13px;color:#e6edf3">${monitor.name}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#9ca3af">URL</td>
                  <td style="padding:6px 0;font-size:13px;color:#58a6ff"><a href="${monitor.url}" style="color:#58a6ff;text-decoration:none">${monitor.url}</a></td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#9ca3af">Status</td>
                  <td style="padding:6px 0;font-size:13px;font-weight:600;color:${color}">${statusText.toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#9ca3af">Time</td>
                  <td style="padding:6px 0;font-size:13px;color:#e6edf3">${new Date().toUTCString()}</td>
                </tr>
                ${isDown && incident.rootCause ? `
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#9ca3af">Error</td>
                  <td style="padding:6px 0;font-size:13px;font-family:monospace;color:#fca5a5">${incident.rootCause}</td>
                </tr>` : ""}
              </table>
            </td>
          </tr>
        </table>
        <p style="margin:0;font-size:12px;color:#6b7280">
          You're receiving this because you configured this alert channel in URL Diagnostics.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendWebhook(url: string, payload: Record<string, unknown>): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "URLDiagnostics/1.0" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    throw new Error(`Webhook returned ${res.status}`);
  }
}

async function notifyWebhook(webhookUrl: string, monitor: MonitorInfo, event: AlertEvent, incident: IncidentInfo): Promise<void> {
  await sendWebhook(webhookUrl, {
    event,
    monitor: { id: monitor.id, name: monitor.name, url: monitor.url },
    incident: { id: incident.id, rootCause: incident.rootCause, startedAt: incident.startedAt },
    timestamp: new Date().toISOString(),
  });
}

async function notifyDiscord(webhookUrl: string, monitor: MonitorInfo, event: AlertEvent, incident: IncidentInfo): Promise<void> {
  const color = event === "down" ? 0xef4444 : event === "ssl_expiry" ? 0xf59e0b : 0x22c55e;
  const title = `${statusEmoji(event)} ${monitor.name} ${statusWord(event)}`;
  await sendWebhook(webhookUrl, {
    embeds: [{
      title,
      color,
      fields: [
        { name: "URL", value: monitor.url, inline: false },
        ...(event === "down" && incident.rootCause
          ? [{ name: "Error", value: `\`${incident.rootCause}\``, inline: false }]
          : []),
        { name: "Time", value: new Date().toUTCString(), inline: false },
      ],
      footer: { text: "URL Diagnostics" },
    }],
  });
}

async function notifySlack(webhookUrl: string, monitor: MonitorInfo, event: AlertEvent, incident: IncidentInfo): Promise<void> {
  const emoji = statusEmoji(event);
  const word = statusWord(event);
  const blocks = [
    {
      type: "section",
      text: { type: "mrkdwn", text: `${emoji} *${monitor.name}* ${word}` },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*URL:*\n${monitor.url}` },
        { type: "mrkdwn", text: `*Time:*\n${new Date().toUTCString()}` },
        ...(event === "down" && incident.rootCause
          ? [{ type: "mrkdwn", text: `*Error:*\n\`${incident.rootCause}\`` }]
          : []),
      ],
    },
  ];
  await sendWebhook(webhookUrl, { text: `${emoji} ${monitor.name} ${word}`, blocks });
}

async function notifyEmail(
  toEmail: string,
  monitor: MonitorInfo,
  event: AlertEvent,
  incident: IncidentInfo,
): Promise<void> {
  if (!resendClient) {
    logger.warn({ toEmail }, "Email alert skipped: RESEND_API_KEY not configured");
    return;
  }

  const subject =
    event === "down"
      ? `🔴 ${monitor.name} is DOWN`
      : event === "ssl_expiry"
      ? `🔒 ${monitor.name} — SSL certificate expiring soon`
      : `🟢 ${monitor.name} has recovered`;

  const fromAddress = process.env.RESEND_FROM_EMAIL ?? "alerts@urldiagnostics.dev";

  const { error } = await resendClient.emails.send({
    from: `URL Diagnostics <${fromAddress}>`,
    to: [toEmail],
    subject,
    html: buildEmailHtml(monitor, event, incident),
  });

  if (error) {
    throw new Error(`Email delivery failed: ${error.message}`);
  }
}

export async function dispatchAlerts(
  channels: AlertChannel[],
  monitor: MonitorInfo,
  event: AlertEvent,
  incident: IncidentInfo,
): Promise<void> {
  const relevant = channels.filter((c) =>
    c.type === "webhook" ||
    c.type === "discord" ||
    c.type === "slack" ||
    c.type === "email"
  );

  await Promise.allSettled(
    relevant.map(async (channel) => {
      try {
        const config = channel.config as Record<string, string>;

        switch (channel.type) {
          case "discord": {
            const url = config["url"] ?? config["webhookUrl"];
            if (!url) { logger.warn({ channelId: channel.id }, "Discord channel has no URL"); return; }
            await notifyDiscord(url, monitor, event, incident);
            break;
          }
          case "slack": {
            const url = config["url"] ?? config["webhookUrl"];
            if (!url) { logger.warn({ channelId: channel.id }, "Slack channel has no URL"); return; }
            await notifySlack(url, monitor, event, incident);
            break;
          }
          case "email": {
            const email = config["email"];
            if (!email) { logger.warn({ channelId: channel.id }, "Email channel has no address"); return; }
            await notifyEmail(email, monitor, event, incident);
            break;
          }
          default: {
            const url = config["url"] ?? config["webhookUrl"];
            if (!url) { logger.warn({ channelId: channel.id }, "Webhook channel has no URL"); return; }
            await notifyWebhook(url, monitor, event, incident);
          }
        }

        logger.info({ channelId: channel.id, channelType: channel.type, event, monitorId: monitor.id }, "Alert dispatched");
      } catch (err) {
        logger.error({ err, channelId: channel.id, monitorId: monitor.id }, "Failed to dispatch alert");
      }
    })
  );
}
