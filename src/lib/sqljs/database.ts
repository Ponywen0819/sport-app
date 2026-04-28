import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import { loadFromIDB, saveToIDB } from "./idb";
import { SCHEMA_SQL } from "./schema";

export type { Database };

let _sqlite3: Sqlite3Static | null = null;
let _dbPromise: Promise<Database> | null = null;

export async function getDatabase(): Promise<Database> {
  if (_dbPromise) return _dbPromise;

  _dbPromise = (async () => {
    const [initSqlite3, savedData] = await Promise.all([
      import("@sqlite.org/sqlite-wasm").then((m) => m.default),
      loadFromIDB(),
    ]);

    // The published types omit the options param, but the Emscripten module
    // does honour { locateFile } at runtime for WASM asset resolution.
    const initWithOpts = initSqlite3 as (opt: {
      locateFile?: (filename: string) => string;
    }) => Promise<Sqlite3Static>;
    const sqlite3 = await initWithOpts({
      locateFile: (filename) => `/${filename}`,
    });
    _sqlite3 = sqlite3;

    const db = new sqlite3.oo1.DB();

    if (savedData) {
      // Restore from IndexedDB — FREEONCLOSE lets SQLite free the buffer
      const ptr = sqlite3.wasm.allocFromTypedArray(savedData);
      sqlite3.capi.sqlite3_deserialize(
        db,
        "main",
        ptr,
        savedData.length,
        savedData.length,
        sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
          sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
      );
    }

    // Always run schema — CREATE TABLE IF NOT EXISTS is idempotent
    db.exec(SCHEMA_SQL);
    runMigrations(db);

    return db;
  })();

  return _dbPromise;
}

/**
 * Idempotent migrations for tables that pre-date schema changes.
 * Each statement is wrapped in try/catch so re-runs on already-migrated DBs
 * (or fresh DBs that already match the new schema) are no-ops.
 */
function runMigrations(db: Database): void {
  const tryExec = (sql: string) => {
    try {
      db.exec(sql);
    } catch {
      // ignore: column already exists / does not exist / etc.
    }
  };
  // exercises: name -> brand + machine_name
  tryExec("ALTER TABLE exercises ADD COLUMN brand TEXT");
  tryExec("ALTER TABLE exercises ADD COLUMN machine_name TEXT");
  tryExec(
    "UPDATE exercises SET machine_name = name WHERE machine_name IS NULL OR machine_name = ''",
  );
  tryExec("ALTER TABLE exercises DROP COLUMN name");

  // workout v2: preserve the legacy exercise_records table while introducing
  // session/block/set-level tables for more flexible workout logging.
  tryExec(`
    INSERT OR IGNORE INTO workout_sessions (id, date, created_at, updated_at)
    SELECT 'legacy-session-' || date, date, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM exercise_records
    GROUP BY date
  `);

  tryExec(`
    INSERT OR IGNORE INTO workout_blocks
      (id, session_id, order_index, type, rounds, created_at, updated_at)
    SELECT
      'legacy-block-' || id,
      'legacy-session-' || date,
      rowid,
      CASE
        WHEN drop_weight_kg IS NOT NULL OR drop_reps IS NOT NULL THEN 'drop_set'
        ELSE 'single'
      END,
      CASE WHEN sets > 0 THEN sets ELSE 1 END,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM exercise_records
  `);

  tryExec(`
    WITH RECURSIVE expanded(record_id, round_number) AS (
      SELECT id, 1 FROM exercise_records
      UNION ALL
      SELECT expanded.record_id, expanded.round_number + 1
      FROM expanded
      JOIN exercise_records ON exercise_records.id = expanded.record_id
      WHERE expanded.round_number <
        CASE WHEN exercise_records.sets > 0 THEN exercise_records.sets ELSE 1 END
    )
    INSERT OR IGNORE INTO exercise_sets
      (id, block_id, exercise_id, exercise_name, round_index, order_index,
       weight_kg, reps, set_type, legacy_record_id, created_at, updated_at)
    SELECT
      'legacy-set-' || r.id || '-' || expanded.round_number || '-0',
      'legacy-block-' || r.id,
      r.exercise_id,
      r.exercise_name,
      expanded.round_number - 1,
      0,
      r.weight_kg,
      r.reps,
      'normal',
      r.id,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM expanded
    JOIN exercise_records r ON r.id = expanded.record_id
  `);

  tryExec(`
    INSERT OR IGNORE INTO exercise_sets
      (id, block_id, exercise_id, exercise_name, round_index, order_index,
       weight_kg, reps, set_type, legacy_record_id, created_at, updated_at)
    SELECT
      'legacy-set-' || id || '-1-1',
      'legacy-block-' || id,
      exercise_id,
      exercise_name,
      0,
      1,
      COALESCE(drop_weight_kg, 0),
      COALESCE(drop_reps, 0),
      'drop',
      id,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM exercise_records
    WHERE drop_weight_kg IS NOT NULL OR drop_reps IS NOT NULL
  `);
}

/** Persist the in-memory database to IndexedDB. */
export async function persistDatabase(): Promise<void> {
  if (!_dbPromise || !_sqlite3) return;
  const db = await _dbPromise;
  const data = _sqlite3.capi.sqlite3_js_db_export(db);
  await saveToIDB(data);
}

/** Reset the singleton (useful after clearing all data). */
export function resetDatabaseSingleton(): void {
  _dbPromise = null;
  _sqlite3 = null;
}
