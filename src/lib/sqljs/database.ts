import type { Database } from "sql.js";
import { loadFromIDB, saveToIDB } from "./idb";
import { SCHEMA_SQL } from "./schema";

// Singleton promise — reused across hot-reloads in dev
let _dbPromise: Promise<Database> | null = null;

export async function getDatabase(): Promise<Database> {
  if (_dbPromise) return _dbPromise;

  _dbPromise = (async () => {
    const [initSqlJs, savedData] = await Promise.all([
      import("sql.js").then((m) => m.default),
      loadFromIDB(),
    ]);

    const SQL = await initSqlJs({ locateFile: () => "/sql-wasm.wasm" });

    if (savedData) {
      return new SQL.Database(savedData);
    }

    const db = new SQL.Database();
    db.run(SCHEMA_SQL);
    return db;
  })();

  return _dbPromise;
}

/** Persist the in-memory database to IndexedDB. */
export async function persistDatabase(): Promise<void> {
  if (!_dbPromise) return;
  const db = await _dbPromise;
  await saveToIDB(db.export());
}

/** Reset the singleton (useful for testing or after clearing data). */
export function resetDatabaseSingleton(): void {
  _dbPromise = null;
}
