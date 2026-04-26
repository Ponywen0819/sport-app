# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (Next.js 15 with Turbopack)
npm run dev          # Start dev server
npm run build        # Production build (output: standalone)
npm run start        # Start production server
npm run lint         # Run ESLint (next lint)

# Docker (uses .next/standalone output)
docker build -t sport-app .
docker run -e PORT=3000 -p 3000:3000 sport-app

# PWA icons
node scripts/generate-icons.mjs
```

> Use `npm` (the lockfile is `package-lock.json`). The Dockerfile uses `npm ci`.
> No test runner is configured. There is no `test` script.
> Node version: 22 (`.nvmrc`); the Dockerfile also pins `node:22-alpine`.

The `scripts/*.js` Notion bootstrap helpers (`setup-exercises-db.js`,
`migrate-*.js`, etc.) are one-off Node scripts run with
`node --env-file=.env.local scripts/<file>.js` against a `NOTION_TOKEN` and a
`NOTION_ROOT_PAGE_ID`. They are not invoked by the app at runtime.

## Architecture

This is a personal PWA for tracking nutrition, workouts, and body composition.
The app is **Notion-backed**: there is no application database. The user supplies
their own Notion API token + 5 database IDs and all data is read/written against
their workspace.

### Settings → cookies → API routes

Notion credentials are entered on `/profile/notion-settings` (the form lives in
`src/app/profile/components/notion-settings-form.tsx`). The flow:

1. Form writes to the Zustand `notion-store` (`src/stores/notion-store.ts`).
2. `setSettings()` persists to `localStorage` **and** mirrors values to cookies
   via `syncNotionCookies()` so server code can see them.
3. Server-side helpers in `src/app/api/notion/_config.ts`
   (`getNutritionConfig`, `getExerciseConfig`, `getExercisesConfig`,
   `getBodyIndexConfig`) read those cookies and return `null` → the route
   returns 401 via `notConfigured()`.
4. Server pages (`/nutrition`, `/workouts`, `/profile/body-index`) check the
   relevant cookies in their server component and render `<NotConfigured />`
   when missing instead of mounting the client tree.

Cookie names (all set with 1-year expiry):
`notion_token`, `notion_foods_db_id`, `notion_meal_items_db_id`,
`notion_exercise_records_db_id`, `notion_exercises_db_id`,
`notion_body_indexes_db_id`.

`POST /api/notion/validate` accepts the full settings object and returns a
boolean per cookie — used by the settings form's "test connection" button.

### Notion data layer

```
src/lib/notion/
  ├── client.ts          # createNotionClient(token) → @notionhq/client v2 Client
  ├── setup.ts           # Schema definitions + checkDatabaseSchema /
  │                      # migrateDatabaseSchema / setupNotionDatabases
  ├── repositories/      # One class per DB (FoodsRepository, MealItemsRepository,
  │                      # ExerciseRecordsRepository, ExercisesRepository,
  │                      # BodyIndexesRepository) — all CRUD via databases.query /
  │                      # pages.create / pages.update({archived: true})
  └── mappers/           # *Mapper.fromPage(page) → typed object
                         # *Mapper.toProperties(data) → Notion property payload
```

Repositories accept `(client, databaseId)` in the constructor. The title
property name is **detected at runtime** (see `FoodsRepository.search`) because
users may rename it; do the same when introducing a new repo that writes to a
title field.

Schemas in `setup.ts` are the source of truth for required Notion DB columns.
Two pages render a "schema gate" client component that calls
`GET /api/notion/.../schema` (returns missing properties), blocks rendering of
its children when columns are missing, and offers one-click `POST` migration:
- Nutrition: `src/app/(date)/nutrition/components/schema-mismatch-banner.tsx`
  → `/api/notion/nutrition/schema`
- Body index: `src/app/profile/body-index/components/schema-gate.tsx`
  → `/api/notion/body-index/schema`

When you add a property to a Notion DB schema, also wire it into the
corresponding `*-mapper.ts` (both `fromPage` and `toProperties`) and add it to
the schema gate's expected columns.

### API routes ↔ client fetchers

All Notion calls are server-side (under `src/app/api/notion/...`). Client
components never import `@notionhq/client`; they call typed fetch helpers in
`src/lib/api/`:

| Helper                     | API route prefix                |
| -------------------------- | ------------------------------- |
| `src/lib/api/exercise.ts`  | `/api/notion/exercise/...`      |
| `src/lib/api/nutrition.ts` | `/api/notion/nutrition/...`     |
| `src/lib/api/body-index.ts`| `/api/notion/body-index/...`    |

When adding an endpoint, update both the API route and the matching helper —
client code should never call `fetch` against `/api/notion/...` directly.

### State management

Four Zustand stores (vanilla `createStore`, each wrapped in a React context
provider so the store can be created lazily on the client):

| Store                                    | Provider                                      | Persistence |
| ---------------------------------------- | --------------------------------------------- | ----------- |
| `notion-store.ts` (settings)             | `notion-store-provider.tsx`                   | localStorage + cookies |
| `nutrition-goals-store.ts`               | `nutrition-goals-provider.tsx`                | localStorage |
| `recent-foods-store.ts` (last 10)        | `recent-foods-provider.tsx`                   | localStorage |
| `recent-exercises-store.ts`              | `recent-exercises-provider.tsx`               | localStorage |

All four providers are mounted in `src/app/layout.tsx`. The notion-store
provider also rehydrates from `localStorage` on mount and re-syncs cookies, so
returning users don't need to re-enter credentials.

The currently selected date is **not** in a global store — it's local
`useState<CalendarDate>` inside each page's client component (e.g.
`NutritionClient`, `WorkoutsClient`). The `(date)/` route group's `layout.tsx`
is currently a passthrough; no date context is provided.

### React Query

`src/providers/query-provider.tsx` configures a single `QueryClient` with
`staleTime: 5min`, `gcTime: 15min`, `refetchOnWindowFocus: false`,
`refetchOnReconnect: false` — tuned for a personal app where the only writer is
the user themselves. After mutations, invalidate by query key prefix
(e.g. `["body-index"]`).

### Navigation

- `BottomNav` (4 tabs: `/`, `/workouts`, `/nutrition`, `/profile`) is rendered
  globally in `layout.tsx`.
- `SwipeNavigator` listens for horizontal touch swipes (≥72px, vertical drift
  <50px) and navigates between the same 4 tabs in order.

## Key constraints

- **`@notionhq/client` must stay on v2.x.** v3+ replaced `databases.query` with
  `dataSources.query`; every repository would break.
- **`output: "standalone"`** is set in `next.config.ts` so the Docker image can
  ship `.next/standalone/server.js`. The standalone server reads `PORT` at
  runtime.
- **Serwist (PWA) is production-only.** `next.config.ts` only wraps the config
  with `withSerwistInit` when `NODE_ENV === "production"`. The service worker
  source is `src/app/sw.ts`; the build emits `public/sw.js` (gitignored).
- **`prisma/`** (sqlite + `schema.prisma`) is a leftover from an earlier
  database-backed version and is not used by the running app. Don't add new
  Prisma code; if you find a runtime reference, it's a bug.
- **Path alias:** `@/*` → `./src/*` (see `tsconfig.json`).
- **Locale:** UI strings are Traditional Chinese (`zh-TW`); the time helpers in
  `src/utils/time.ts` default to `Asia/Taipei`.
