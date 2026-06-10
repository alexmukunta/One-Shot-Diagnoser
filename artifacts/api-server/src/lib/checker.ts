import https from "https";
import http from "http";
import dns from "dns/promises";
import tls from "tls";
import { logger } from "./logger";

export interface CheckResult {
  status: "up" | "down" | "timeout" | "error";
  httpStatus: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
  sslValid: boolean | null;
  sslDaysRemaining: number | null;
}

export interface DiagnoseResult {
  url: string;
  checkedAt: Date;
  availability: {
    status: "up" | "down" | "timeout" | "error";
    httpStatus: number | null;
    responseTimeMs: number | null;
    errorMessage: string | null;
  };
  ssl?: {
    valid: boolean;
    issuer: string | null;
    expiresAt: Date | null;
    daysRemaining: number | null;
    protocol: string | null;
    cipher: string | null;
  };
  dns?: {
    resolved: boolean;
    ipAddress: string | null;
    aRecords: string[];
    ttl: number | null;
  };
  headers?: Record<string, string>;
  performance?: {
    score: number;
    grade: string;
    ttfbMs: number | null;
    responseSizeKb: number | null;
    compression: string | null;
  };
  security?: {
    score: number;
    hsts: boolean;
    xFrameOptions: boolean;
    csp: boolean;
    xContentType: boolean;
    referrerPolicy: boolean;
  };
  redirectChain?: Array<{ from: string; to: string | null; status: number }>;
}

function gradePerformance(
  ttfbMs: number | null,
  responseSizeKb: number | null
): { score: number; grade: string } {
  let score = 100;
  if (ttfbMs !== null) {
    if (ttfbMs > 2000) score -= 50;
    else if (ttfbMs > 1000) score -= 30;
    else if (ttfbMs > 500) score -= 15;
    else if (ttfbMs > 200) score -= 5;
  }
  if (responseSizeKb !== null) {
    if (responseSizeKb > 5000) score -= 20;
    else if (responseSizeKb > 1000) score -= 10;
  }
  score = Math.max(0, Math.min(100, score));
  const grade =
    score >= 90
      ? "A"
      : score >= 80
        ? "B"
        : score >= 70
          ? "C"
          : score >= 60
            ? "D"
            : "F";
  return { score, grade };
}

function securityScore(sec: {
  hsts: boolean;
  xFrameOptions: boolean;
  csp: boolean;
  xContentType: boolean;
  referrerPolicy: boolean;
}): number {
  let score = 0;
  if (sec.hsts) score += 25;
  if (sec.xFrameOptions) score += 20;
  if (sec.csp) score += 25;
  if (sec.xContentType) score += 20;
  if (sec.referrerPolicy) score += 10;
  return score;
}

async function resolveDns(hostname: string): Promise<{
  resolved: boolean;
  ipAddress: string | null;
  aRecords: string[];
  ttl: number | null;
}> {
  try {
    const records = await dns.resolve4(hostname);
    return {
      resolved: true,
      ipAddress: records[0] ?? null,
      aRecords: records,
      ttl: null,
    };
  } catch {
    return { resolved: false, ipAddress: null, aRecords: [], ttl: null };
  }
}

function getSslInfo(socket: tls.TLSSocket): {
  valid: boolean;
  issuer: string | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
  protocol: string | null;
  cipher: string | null;
} {
  try {
    const cert = socket.getPeerCertificate();
    const protocol = socket.getProtocol();
    const cipher = socket.getCipher()?.name ?? null;
    if (!cert || !cert.valid_to) {
      return {
        valid: false,
        issuer: null,
        expiresAt: null,
        daysRemaining: null,
        protocol: protocol ?? null,
        cipher,
      };
    }
    const expiresAt = new Date(cert.valid_to);
    const daysRemaining = Math.floor(
      (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const issuerO = cert.issuer?.O;
    const issuerCN = cert.issuer?.CN;
    const issuer = (Array.isArray(issuerO) ? issuerO[0] : issuerO) ?? (Array.isArray(issuerCN) ? issuerCN[0] : issuerCN) ?? null;
    return {
      valid: socket.authorized && daysRemaining > 0,
      issuer,
      expiresAt,
      daysRemaining,
      protocol: protocol ?? null,
      cipher,
    };
  } catch {
    return {
      valid: false,
      issuer: null,
      expiresAt: null,
      daysRemaining: null,
      protocol: null,
      cipher: null,
    };
  }
}

const MAX_BODY_BYTES = 512 * 1024; // 512 KB keyword scan limit

export async function checkUrl(
  url: string,
  timeoutMs = 10000,
  method = "GET",
  expectedStatus = 200,
  keywordAssertion?: string | null,
): Promise<CheckResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    let settled = false;
    const settle = (result: CheckResult) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      settle({
        status: "timeout",
        httpStatus: null,
        responseTimeMs: timeoutMs,
        errorMessage: "Request timed out",
        sslValid: null,
        sslDaysRemaining: null,
      });
    }, timeoutMs);

    const parsed = new URL(url);
    const isHttps = parsed.protocol === "https:";
    const lib = isHttps ? https : http;

    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      timeout: timeoutMs,
      headers: { "User-Agent": "URLDiagnostics/1.0" },
    };

    const req = lib.request(options, (res) => {
      const responseTimeMs = Date.now() - start;
      clearTimeout(timer);

      const httpStatus = res.statusCode ?? null;
      const statusOk = httpStatus !== null && httpStatus === expectedStatus;

      let sslValid: boolean | null = null;
      let sslDaysRemaining: number | null = null;
      if (isHttps && (req.socket as tls.TLSSocket).authorized !== undefined) {
        const socket = req.socket as tls.TLSSocket;
        const info = getSslInfo(socket);
        sslValid = info.valid;
        sslDaysRemaining = info.daysRemaining;
      }

      if (keywordAssertion) {
        const chunks: Buffer[] = [];
        let bytesRead = 0;
        res.on("data", (chunk: Buffer) => {
          bytesRead += chunk.length;
          if (bytesRead <= MAX_BODY_BYTES) chunks.push(chunk);
        });
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          const found = body.includes(keywordAssertion);
          settle({
            status: statusOk && found ? "up" : "down",
            httpStatus,
            responseTimeMs,
            errorMessage: !statusOk
              ? `Expected status ${expectedStatus}, got ${httpStatus}`
              : !found
                ? `Keyword "${keywordAssertion}" not found in response`
                : null,
            sslValid,
            sslDaysRemaining,
          });
        });
      } else {
        res.resume();
        settle({
          status: statusOk ? "up" : "down",
          httpStatus,
          responseTimeMs,
          errorMessage: statusOk ? null : `Expected status ${expectedStatus}, got ${httpStatus}`,
          sslValid,
          sslDaysRemaining,
        });
      }
    });

    req.on("error", (err) => {
      clearTimeout(timer);
      settle({
        status: "error",
        httpStatus: null,
        responseTimeMs: Date.now() - start,
        errorMessage: err.message,
        sslValid: null,
        sslDaysRemaining: null,
      });
    });

    req.end();
  });
}

export async function diagnoseUrl(rawUrl: string): Promise<DiagnoseResult> {
  const start = Date.now();
  const checkedAt = new Date();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return {
      url: rawUrl,
      checkedAt,
      availability: {
        status: "error",
        httpStatus: null,
        responseTimeMs: null,
        errorMessage: "Invalid URL",
      },
    };
  }

  const hostname = parsedUrl.hostname;
  const isHttps = parsedUrl.protocol === "https:";

  const [dnsResult] = await Promise.all([resolveDns(hostname)]);

  return new Promise((resolve) => {
    const redirectChain: Array<{ from: string; to: string | null; status: number }> = [];
    let sslInfo: DiagnoseResult["ssl"] | undefined;
    let responseHeaders: Record<string, string> = {};
    let responseSizeBytes = 0;
    let firstByteTime: number | null = null;

    const doRequest = (currentUrl: string, hops = 0) => {
      if (hops > 10) {
        resolve({
          url: rawUrl,
          checkedAt,
          availability: {
            status: "error",
            httpStatus: null,
            responseTimeMs: Date.now() - start,
            errorMessage: "Too many redirects",
          },
          dns: dnsResult,
          redirectChain,
        });
        return;
      }

      let parsed: URL;
      try {
        parsed = new URL(currentUrl);
      } catch {
        resolve({
          url: rawUrl,
          checkedAt,
          availability: {
            status: "error",
            httpStatus: null,
            responseTimeMs: Date.now() - start,
            errorMessage: "Invalid redirect URL",
          },
          dns: dnsResult,
          redirectChain,
        });
        return;
      }

      const isCurrentHttps = parsed.protocol === "https:";
      const lib = isCurrentHttps ? https : http;

      const options: https.RequestOptions = {
        hostname: parsed.hostname,
        port: parsed.port || (isCurrentHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: "GET",
        timeout: 10000,
        headers: { "User-Agent": "URLDiagnostics/1.0" },
      };

      const req = lib.request(options, (res) => {
        const httpStatus = res.statusCode ?? 0;

        if (isCurrentHttps) {
          try {
            const socket = req.socket as tls.TLSSocket;
            if (socket && typeof socket.getPeerCertificate === "function") {
              sslInfo = getSslInfo(socket);
            }
          } catch {
            logger.debug("Failed to get SSL info");
          }
        }

        if (httpStatus >= 300 && httpStatus < 400 && res.headers.location) {
          redirectChain.push({
            from: currentUrl,
            to: res.headers.location,
            status: httpStatus,
          });
          res.resume();
          doRequest(res.headers.location, hops + 1);
          return;
        }

        let bodySize = 0;
        res.on("data", (chunk: Buffer) => {
          if (firstByteTime === null) {
            firstByteTime = Date.now() - start;
          }
          bodySize += chunk.length;
          responseSizeBytes += chunk.length;
        });

        res.on("end", () => {
          const responseTimeMs = Date.now() - start;
          const hdrs: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (typeof v === "string") hdrs[k] = v;
            else if (Array.isArray(v)) hdrs[k] = v[0] ?? "";
          }
          responseHeaders = hdrs;

          const compression = hdrs["content-encoding"] ?? null;
          const responseSizeKb = bodySize / 1024;
          const { score, grade } = gradePerformance(
            firstByteTime,
            responseSizeKb
          );

          const security = {
            hsts: "strict-transport-security" in hdrs,
            xFrameOptions: "x-frame-options" in hdrs,
            csp: "content-security-policy" in hdrs,
            xContentType: "x-content-type-options" in hdrs,
            referrerPolicy: "referrer-policy" in hdrs,
          };

          resolve({
            url: rawUrl,
            checkedAt,
            availability: {
              status:
                httpStatus >= 200 && httpStatus < 400
                  ? "up"
                  : httpStatus > 0
                    ? "down"
                    : "error",
              httpStatus,
              responseTimeMs,
              errorMessage: null,
            },
            ssl: isCurrentHttps ? sslInfo : undefined,
            dns: dnsResult,
            headers: responseHeaders,
            performance: {
              score,
              grade,
              ttfbMs: firstByteTime,
              responseSizeKb,
              compression,
            },
            security: { score: securityScore(security), ...security },
            redirectChain: redirectChain.length > 0 ? redirectChain : undefined,
          });
        });
      });

      req.on("error", (err) => {
        resolve({
          url: rawUrl,
          checkedAt,
          availability: {
            status: "error",
            httpStatus: null,
            responseTimeMs: Date.now() - start,
            errorMessage: err.message,
          },
          dns: dnsResult,
          redirectChain: redirectChain.length > 0 ? redirectChain : undefined,
        });
      });

      req.end();
    };

    doRequest(rawUrl);
  });
}
