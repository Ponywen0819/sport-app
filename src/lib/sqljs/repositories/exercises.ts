import type { Database } from "@sqlite.org/sqlite-wasm";
import type { Exercise } from "@/lib/notion/mappers/exercise-mapper";

type Row = Record<string, import("@sqlite.org/sqlite-wasm").SqlValue>;

function rowToExercise(row: Row): Exercise {
  return {
    id: row.id as string,
    brand: (row.brand as string) ?? "",
    machineName: (row.machine_name as string) ?? "",
    equipment: (row.equipment as string) ?? "",
    muscleGroups: row.muscle_groups
      ? JSON.parse(row.muscle_groups as string)
      : [],
  };
}

export const exercisesLocalRepo = {
  upsertMany(db: Database, exercises: Exercise[]): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO exercises (id, brand, machine_name, equipment, muscle_groups)
      VALUES (:id, :brand, :machine_name, :equipment, :muscle_groups)
    `);
    for (const e of exercises) {
      stmt
        .bind({
          ":id": e.id,
          ":brand": e.brand || null,
          ":machine_name": e.machineName,
          ":equipment": e.equipment ?? null,
          ":muscle_groups": JSON.stringify(e.muscleGroups),
        })
        .stepReset();
    }
    stmt.finalize();
  },

  upsert(db: Database, exercise: Exercise): void {
    this.upsertMany(db, [exercise]);
  },

  delete(db: Database, id: string): void {
    db.exec({ sql: "DELETE FROM exercises WHERE id = ?", bind: [id] });
  },

  search(db: Database, name?: string): Exercise[] {
    const sql = name
      ? `SELECT * FROM exercises
         WHERE brand LIKE :q OR machine_name LIKE :q
         ORDER BY machine_name LIMIT 100`
      : "SELECT * FROM exercises ORDER BY machine_name LIMIT 100";
    const stmt = db.prepare(sql);
    if (name) stmt.bind({ ":q": `%${name}%` });
    const rows: Exercise[] = [];
    while (stmt.step()) rows.push(rowToExercise(stmt.get({}) as Row));
    stmt.finalize();
    return rows;
  },

  getById(db: Database, id: string): Exercise | null {
    const stmt = db.prepare("SELECT * FROM exercises WHERE id = :id");
    stmt.bind({ ":id": id });
    if (stmt.step()) {
      const row = rowToExercise(stmt.get({}) as Row);
      stmt.finalize();
      return row;
    }
    stmt.finalize();
    return null;
  },

  count(db: Database): number {
    const stmt = db.prepare("SELECT COUNT(*) as cnt FROM exercises");
    stmt.step();
    const cnt = Number((stmt.get({}) as Row).cnt);
    stmt.finalize();
    return cnt;
  },
};
