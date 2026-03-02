# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
node_modules/.bin/pnpm dev          # Start dev server (Turbopack)
node_modules/.bin/pnpm build        # Production build
node_modules/.bin/pnpm start        # Start production server
node_modules/.bin/pnpm lint         # Run ESLint

# Docker
docker build -t sport-app .
docker run -e PORT=3000 -p 3000:3000 sport-app

# Icon generation
node scripts/generate-icons.mjs
```

> `pnpm` is not in PATH — always use `node_modules/.bin/pnpm`.

## Architecture

**No backend database.** All data lives in the user's own Notion workspace. The app uses Notion as both auth provider (OAuth) and database.

### Settings flow

Notion credentials (token + 5 DB IDs) are entered by the user on `/profile`, stored in **localStorage** via Zustand, and **synced to cookies** so server-side code (API routes) can read them. There is no `.env` dependency for Notion credentials at runtime.

Cookie names: `notion_token`, `notion_foods_db_id`, `notion_meal_items_db_id`, `notion_exercise_records_db_id`, `notion_exercises_db_id`, `notion_body_indexes_db_id`.

Pages check for required cookies on the server and render `<NotConfigured />` when missing.

### Data layer

```
Notion API
  └── src/lib/notion/
        ├── client.ts          # Creates NotionClient from token
        ├── repositories/      # One file per Notion DB (query/create/delete)
        └── mappers/           # Convert Notion page objects ↔ TypeScript types
```

### API routes → client fetch

All Notion calls are server-side (in API routes). Client components call `/api/notion/…` via fetch helpers in `src/lib/api/`:

| Client helper | API route |
|---|---|
| `src/lib/api/exercise.ts` | `src/app/api/notion/exercise/…` |
| `src/lib/api/nutrition.ts` | `src/app/api/notion/nutrition/…` |

`src/app/api/notion/_config.ts` contains shared helpers (`getExerciseConfig()`, `getNutritionConfig()`) that read cookies and return `null` → 401 when not configured.

### State management

| Store | Location | Persisted to |
|---|---|---|
| Notion settings | `src/stores/notion-store.ts` | localStorage + cookies |
| Selected date | `src/stores/date-store.ts` | cookies |

Both use Zustand `createStore` (vanilla) wrapped in React context providers (`src/providers/`).

### Route groups

- `(date)/` — wraps `/nutrition` with `DateStore` context; all pages in this group share the currently selected date.

### Key constraints

- **@notionhq/client must stay on v2.x** — v5 changed `databases.query` to `dataSources.query`, which breaks all repositories.
- **`output: "standalone"`** is set in `next.config.ts` for the Docker build. The standalone server reads the `PORT` env var at runtime.
- PWA service worker is disabled in development (`NODE_ENV === "development"`).
