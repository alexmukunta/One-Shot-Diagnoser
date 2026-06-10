# URL Diagnostics

A full-stack uptime monitoring SaaS — one-shot URL diagnostics, scheduled monitors, incident tracking, SSL/DNS checks, status pages, and Clerk authentication.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/web run dev` — run the frontend (port 22333)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (provisioned)
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — provisioned via Replit-managed Clerk

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, TanStack Query, Wouter, Tailwind v4, Recharts
- Auth: Clerk (`@clerk/express` server-side, `@clerk/react` client-side with proxy middleware)
- API: Express 5 + OpenAPI spec (contract-first)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod, `drizzle-zod`
- API codegen: Orval (React Query hooks from OpenAPI spec)
- Build: esbuild (CJS bundle for API server)

## Where things live

- **DB schema**: `lib/db/src/schema/` — monitors, monitor_checks, incidents, alert_channels, tags, status_pages
- **OpenAPI spec**: `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- **Generated hooks**: `lib/api-client-react/src/generated/` — auto-generated, do not edit
- **Generated Zod schemas**: `lib/api-zod/src/generated/` — auto-generated, do not edit
- **API routes**: `artifacts/api-server/src/routes/` — one file per resource
- **Frontend pages**: `artifacts/web/src/pages/` — landing, dashboard, monitors, incidents, alert-channels, status-pages, diagnose, status-public
- **Clerk proxy**: `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts`
- **Theme**: `artifacts/web/src/index.css` — always-dark, sky-blue primary, status color utilities

## Architecture decisions

- **Contract-first API**: OpenAPI spec defines the contract; Orval generates React Query hooks and Zod schemas from it. Never manually write fetch calls or type definitions for API responses.
- **Clerk proxy pattern**: The API server proxies Clerk auth requests so the frontend talks to the same origin. `getAuth(req)` extracts `userId` in all protected routes.
- **Always-dark theme**: No light mode toggle — this is a developer/ops tool; forced dark in CSS `:root` (no `.dark` class needed on `<html>`).
- **String IDs on API**: DB uses serial integers but API exposes string IDs (`String(numericId)`) for forward compatibility.
- **Orval barrel fix**: The codegen script auto-overwrites `lib/api-zod/src/index.ts` to `export * from "./generated/api"` to avoid TS2308 collisions.

## Product

- **Landing page**: Marketing page with feature overview and CTA; redirects signed-in users to /dashboard
- **Dashboard**: Summary stats (total/up/down/degraded monitors), monitor list, recent incidents
- **Monitors**: Full CRUD — create, list, pause/resume, delete, trigger manual check
- **Monitor detail**: Response time area chart, uptime stats (24h/7d/30d), recent checks table, incidents tab, settings tab
- **Incidents**: List all incidents; detail view with acknowledge, duration, root cause
- **Alert channels**: Email, Slack, Discord, webhook — create, test, delete
- **Status pages**: Create public status pages with selected monitors; public view at /status/:slug shows uptime bars + active incidents
- **Diagnose URL**: One-shot check returning availability, SSL, DNS, performance grade, security headers, redirect chain

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Do not run codegen before starting a dev session** unless the OpenAPI spec changed — the generated files are committed.
- **Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml`** — then restart the web workflow.
- **Port from $PORT env var**: both API server and web dev server read `PORT` from the environment (set by the workflow system). Never hardcode ports.
- **Clerk development mode banner**: The orange "Development mode" banner on the sign-in page is expected in dev; it disappears in production.
- **DB schema push timing**: Always run `pnpm --filter @workspace/db run push` AFTER schema files are in place.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk auth customization guidance
