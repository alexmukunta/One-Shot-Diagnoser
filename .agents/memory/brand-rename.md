---
name: Brand rename
description: Product was renamed from "URL Diagnostics" to "One Shot Diagnoser" — files that needed updating
---

## Rule
The product is called **One Shot Diagnoser**. Use this name everywhere user-facing.

**Why:** User explicitly requested the rename from "URL Diagnostics" to "One Shot Diagnoser".

## Files updated (user-facing only)
- `artifacts/web/index.html` — `<title>` and all meta/OG tags
- `artifacts/web/src/pages/landing.tsx` — header, hero h1, footer
- `artifacts/web/src/components/AppLayout.tsx` — sidebar logo text
- `artifacts/web/src/App.tsx` — Clerk `localization` prop overrides sign-in/sign-up titles
- `artifacts/api-server/src/lib/notifier.ts` — email badge, Discord footer, `from` label

## Do NOT rename
- `lib/api-zod/src/generated/*` — auto-generated from OpenAPI `info.title: "URL Diagnostics"`; renaming `info.title` would change all generated filenames and break imports. Leave these as-is.
- `lib/api-client-react/src/generated/*` — same reason.
- `replit.md` title — updated separately to "One Shot Diagnoser".

## Clerk sign-in title
Clerk's default "Sign in to Scaly Suspicious Machines" is overridden via the `localization` prop on `<ClerkProvider>` in `App.tsx`. No Clerk dashboard access needed.
**How to apply:** Always use the `localization` prop — never try to change the Replit Clerk app name directly.
