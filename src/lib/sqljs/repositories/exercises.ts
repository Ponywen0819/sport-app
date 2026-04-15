import type { Database } from "sql.js";
import type { Exercise } from "@/lib/notion/mappers/exercise-mapper";

type Row = { [key: string]: number | string | Uint8Array | null };

function rowToExercise(row: Row): Exercise {
  return {
    id: row.id as string,
    name: row.name as string,
    equipment: (row.equipment as string) ?? "",
    muscleGroups: row.muscle_groups
      ? JSON.parse(row.muscle_groups as string)
      : [],
  };
}

export const exercisesLocalRepo = {
  upsertMany(db: Database, exercises: Exercise[]): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO exercises (id, name, equipment, muscle_groups)
      VALUES (:id, :name, :equipment, :muscle_groups)
    `);
    for (const e of exercises) {
      stmt.run({
        ":id": e.id,
        ":name": e.name,
        ":equipment": e.equipment ?? null,
        ":muscle_groups": JSON.stringify(e.muscleGroups),
      });
    }
    stmt.free();
  },

  search(db: Database, name?: string): Exercise[] {
    const sql = name
      ? "SELECT * FROM exercises WHERE name LIKE :name ORDER BY name LIMIT 100"
      : "SELECT * FROM exercises ORDER BY name LIMIT 100";
    const stmt = db.prepare(sql);
    if (name) stmt.bind({ ":name": `%${name}%` });
    const rows: Exercise[] = [];
    while (stmt.step()) rows.push(rowToExercise(stmt.getAsObject() as Row));
    stmt.free();
    return rows;
  },

  getById(db: Database, id: string): Exercise | null {
    const stmt = db.prepare("SELECT * FROM exercises WHERE id = :id");
    stmt.bind({ ":id": id });
    if (stmt.step()) {
      const row = rowToExercise(stmt.getAsObject() as Row);
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  count(db: Database): number {
    const stmt = db.prepare("SELECT COUNT(*) as cnt FROM exercises");
    stmt.step();
    const cnt = (stmt.getAsObject() as Row).cnt as number;
    stmt.free();
    return cnt;
  },
};
