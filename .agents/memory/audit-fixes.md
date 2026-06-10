---
name: Production audit fixes
description: Decisions made during the pre-launch audit — security, logic, performance, and trust fixes
---

## sql.raw removed — use inArray()
dashboard.ts and status-pages.ts used `sql.raw(ARRAY[...ids...])` for multi-id WHERE clauses.
Replaced with Drizzle's `inArray()` from `drizzle-orm`.
**Why:** sql.raw bypasses Drizzle's parameterization layer; inArray is the correct idiomatic approach.
**How to apply:** Any multi-id filter in this codebase should use `inArray(table.column, arrayOfIds)`.

## degraded status is now live
runCheck.ts: checker result "timeout" maps to DB status "degraded"; "error"/"down" map to "down".
Incident open/close logic uses `isFailure = down || degraded` and `wasFailure = down || degraded`.
**Why:** Timeout means the server is reachable but unresponsive — uncertain state, not a confirmed failure.

## IDOR fix on tag assignment
monitors/index.ts POST /monitors/:id/tags: tag ownership is now verified against userId before insert.
**Why:** Without the check, a user could associate any tag (from any other user) with their monitor.

## Dashboard N+1 eliminated
dashboard.ts: Replaced per-monitor check queries (2 × N queries) with a single batched query across all monitor IDs using inArray + gte(since7d), then JS-filtered for 24h/7d uptime.

## Landing page trust fixes
Removed: "Beta · Free while we're getting started" badge, fabricated stats strip (99.9% uptime, <30s detection), "50 monitors free" false pricing claim.
Replaced with: "No credit card required" in the feature list.
**Why:** Fabricated statistics and beta labels reduce user trust and can be misleading.
