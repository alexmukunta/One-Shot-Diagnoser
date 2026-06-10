import dns from "dns/promises";
import { isIP } from "net";
import { logger } from "./logger";

const PRIVATE_RANGES: [number, number][] = [
  [ipToNum("0.0.0.0"), ipToNum("0.255.255.255")],
  [ipToNum("10.0.0.0"), ipToNum("10.255.255.255")],
  [ipToNum("100.64.0.0"), ipToNum("100.127.255.255")],
  [ipToNum("127.0.0.0"), ipToNum("127.255.255.255")],
  [ipToNum("169.254.0.0"), ipToNum("169.254.255.255")],
  [ipToNum("172.16.0.0"), ipToNum("172.31.255.255")],
  [ipToNum("192.0.0.0"), ipToNum("192.0.0.255")],
  [ipToNum("192.168.0.0"), ipToNum("192.168.255.255")],
  [ipToNum("198.18.0.0"), ipToNum("198.19.255.255")],
  [ipToNum("198.51.100.0"), ipToNum("198.51.100.255")],
  [ipToNum("203.0.113.0"), ipToNum("203.0.113.255")],
  [ipToNum("224.0.0.0"), ipToNum("255.255.255.255")],
];

function ipToNum(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd")) {
    return true;
  }
  if (isIP(ip) !== 4) return false;
  const num = ipToNum(ip);
  return PRIVATE_RANGES.some(([lo, hi]) => num >= lo && num <= hi);
}

export async function validateNoSsrf(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  const { hostname, protocol } = parsed;
  if (protocol !== "http:" && protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }

  if (hostname === "localhost") {
    throw new Error("SSRF: localhost is not allowed");
  }

  if (isIP(hostname) === 4) {
    if (isPrivateIp(hostname)) {
      throw new Error("SSRF: private IP addresses are not allowed");
    }
    return;
  }

  if (isIP(hostname) === 6) {
    if (hostname === "::1" || hostname.toLowerCase().startsWith("fe80")) {
      throw new Error("SSRF: private IPv6 addresses are not allowed");
    }
    return;
  }

  let addresses: string[] = [];
  try {
    addresses = await dns.resolve4(hostname);
  } catch {
    try {
      const v6 = await dns.resolve6(hostname);
      for (const addr of v6) {
        if (addr === "::1" || addr.startsWith("fe80")) {
          throw new Error("SSRF: hostname resolves to a private IPv6 address");
        }
      }
      return;
    } catch (e2) {
      if ((e2 as Error).message.startsWith("SSRF")) throw e2;
      logger.debug({ hostname }, "DNS resolution failed — will let the request attempt and fail");
      return;
    }
  }

  for (const addr of addresses) {
    if (isPrivateIp(addr)) {
      throw new Error(`SSRF: ${hostname} resolves to a private IP (${addr})`);
    }
  }
}
