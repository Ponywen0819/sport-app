# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Overview

Personal fitness tracker PWA built with Next.js 15 + React 19. **No backend database** — all data lives in the user's own Notion workspace. UI is entirely in Traditional Chinese (zh-TW).

Tech stack: Next.js 15, TypeScript, Tailwind CSS v4, Zustand 5, TanStack React Query 5, @notionhq/client v2.x.

# Project Structure

```
src/
├── app/
│   ├── api/notion/        # Server-side API routes (exercise, nutrition, body-index)
│   │   └── _config.ts     # Shared cookie readers → 401 if not configured
│   └── (date)/            # Route group: wraps /nutrition with DateStore context
├── lib/
│   ├── api/               # Client-side fetch helpers (call the API routes above)
│   └── notion/
│       ├── client.ts      # Creates NotionClient from token
│       ├── repositories/  # One file per Notion DB (query/create/delete)
│       └── mappers/       # Notion PageObjectResponse ↔ TypeScript types
├── stores/                # Zustand vanilla stores
├── providers/             # React context wrappers for each store
└── schema/                # Zod validation schemas
```

# Key Commands

- Build: `npm run build`
- Dev: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`

# Architecture Notes

### Credential flow

Notion credentials (token + 5 DB IDs) are entered on `/profile/notion-settings`, stored in **localStorage** via Zustand, and **synced to cookies** so API routes can read them server-side. No `.env` needed for Notion credentials at runtime.

Cookie names: `notion_token`, `notion_foods_db_id`, `notion_meal_items_db_id`, `notion_exercise_records_db_id`, `notion_exercises_db_id`, `notion_body_indexes_db_id`.

`NotionStoreProvider` hydrates from localStorage on mount and immediately calls `syncNotionCookies()`. Pages render `<NotConfigured />` when cookies are missing.

### State management

All stores use Zustand `createStore` (vanilla) wrapped in React context providers. Access via custom hooks like `useNotionStore(selector)`. Stores persist to localStorage; `notion-store` additionally syncs to cookies.

### Non-obvious implementation details

- **Weights stored as kg in Notion**, displayed in kg or lbs per user preference. Conversion in `exercise-record-mapper.ts`.
- **Drop sets**: `ExerciseRecord` has optional `dropWeightKg` + `dropReps` fields.
- **Progress deduplication**: `getProgressByExercise()` keeps only the heaviest lift per day.
- **Meal item naming**: Auto-generates Notion page title as `"${date} ${mealType} ${foodName}"`.
- **React Query**: 5 min stale time, 15 min GC, no refetchOnWindowFocus — conservative for single-user app.
- **@notionhq/client must stay on v2.x** — v5 changed `databases.query` to `dataSources.query`, breaking all repositories.
