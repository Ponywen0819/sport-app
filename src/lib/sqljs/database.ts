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

    return db;
  })();

  return _dbPromise;
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
