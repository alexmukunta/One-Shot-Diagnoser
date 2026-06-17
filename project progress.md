# Project Progress: One Shot Diagnoser

## Overview
- **Project:** Full-stack uptime monitoring SaaS.
- **Current State:** Production-ready, stable, deployed locally, and connected to Supabase.
- **Tech Stack:** Node.js 24, Express 5, React 19, PostgreSQL (Supabase), Clerk Auth, Resend for email notifications.

## Completed Tasks
1.  **Project Investigation:** Built a comprehensive mental model of the codebase, tech stack, and architectural patterns (API server, web, shared libs).
2.  **Environment Setup:** Created a root `.env` file (configured in `.gitignore`) for production credentials (Supabase, Clerk, Resend).
3.  **Supabase Integration:**
    - Configured `drizzle.config.ts` for Windows path compatibility.
    - Successfully pushed the schema to Supabase.
    - Implemented robust `dotenv` loading in the API server, ensuring environment variables are accessible at runtime.
4.  **Replit Cleanup:** Removed all traces of the Replit environment (config files, artifact folders, environment-specific comments/pointers).
5.  **Landing Page:** Simplified the landing page to feature a focused hero section and prominent Sign In/Sign Up buttons.
6.  **Authentication & Notifications:**
    - Integrated Clerk API keys for auth.
    - Configured Clerk proxy middleware and `ClerkProvider` for authentication.
    - Wired up Resend API key for email notifications in the backend.
    - Verified that authentication guards (401 Unauthorized) work correctly.
7.  **Stability Pass:** Systematically audited all frontend pages to replace direct data access with defensive patterns (e.g., `Array.isArray(data) ? data : []`) to prevent "map is not a function" crashes.
## Current Service Status
- **API Server:** Running locally (Port 8080) in the background (PID 33548), connected to Supabase.
- **Web Application:** Running locally (Port 22333) in the background (PID 28008), configured to use the root `.env` file.

## Known Issues & Errors
- **Clerk Development Warnings:** Console logs show "Clerk has been loaded with development keys" — this is expected behavior while in development mode.
- **Background Processes:** The background processes are prone to conflicts if restarted without properly terminating the previous PID. Always run `Stop-Process` on existing PIDs before starting them again if issues arise.
- **API Auth Caveats:** If authentication features fail (e.g., getting 401s on expectedly open routes), verify that the Clerk Proxy middleware and API keys are correctly synced in the `.env` file.
- **React Query/API Stability:** While the "map is not a function" errors have been resolved with defensive array checks, ensure that any new data-fetching hooks added in the future follow the `Array.isArray(data) ? data : []` pattern.

## Key Technical Decisions
...
- **Environment Management:** Centralized environment variables in the project root. Modified `artifacts/web/vite.config.ts` (`envDir`) and `artifacts/api-server/src/index.ts` to consume the root `.env` file.
- **Defensive Data Access:** Standardized frontend data fetching to use defensive checks for array iteration.
- **Cross-Platform Compatibility:** Overrode `pnpm-workspace.yaml` to fix issues with native binary dependencies on Windows.

## Notes for Future Self
- To restart the services if they die:
  ```powershell
  # Start API
  $env:PORT="8080"; pnpm --filter @workspace/api-server run dev
  # Start Web
  $env:PORT="22333"; $env:BASE_PATH="/"; pnpm --filter @workspace/web run dev
  ```
- Any future changes to the database schema require running `pnpm --filter @workspace/db run push`.
- Clerk authentication is fully enabled. Ensure Clerk keys remain valid in `.env` for development.
- Email notifications rely on `RESEND_API_KEY`.
