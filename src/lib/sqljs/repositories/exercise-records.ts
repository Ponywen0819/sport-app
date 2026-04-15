import type { Database } from "sql.js";
import type { ExerciseRecord } from "@/lib/notion/mappers/exercise-record-mapper";

type Row = { [key: string]: number | string | Uint8Array | null };

function rowToRecord(row: Row): ExerciseRecord {
  return {
    id: row.id as string,
    exerciseName: row.exercise_name as string,
    exerciseId: (row.exercise_id as string | null) ?? null,
    date: row.date as string,
    weightKg: (row.weight_kg as number) ?? 0,
    reps: (row.reps as number) ?? 0,
    sets: (row.sets as number) ?? 1,
    dropWeightKg: (row.drop_weight_kg as number | null) ?? null,
    dropReps: (row.drop_reps as number | null) ?? null,
  };
}

export const exerciseRecordsLocalRepo = {
  upsertMany(db: Database, records: ExerciseRecord[]): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO exercise_records
        (id, exercise_name, exercise_id, date, weight_kg, reps, sets, drop_weight_kg, drop_reps)
      VALUES
        (:id, :exercise_name, :exercise_id, :date, :weight_kg, :reps, :sets, :drop_weight_kg, :drop_reps)
    `);
    for (const r of records) {
      stmt.run({
        ":id": r.id,
        ":exercise_name": r.exerciseName,
        ":exercise_id": r.exerciseId ?? null,
        ":date": r.date,
        ":weight_kg": r.weightKg,
        ":reps": r.reps,
        ":sets": r.sets,
        ":drop_weight_kg": r.dropWeightKg ?? null,
        ":drop_reps": r.dropReps ?? null,
      });
    }
    stmt.free();
  },

  upsert(db: Database, record: ExerciseRecord): void {
    this.upsertMany(db, [record]);
  },

  delete(db: Database, id: string): void {
    db.run("DELETE FROM exercise_records WHERE id = :id", { ":id": id });
  },

  getByDate(db: Database, date: string): ExerciseRecord[] {
    const stmt = db.prepare(
      "SELECT * FROM exercise_records WHERE date = :date ORDER BY rowid DESC"
    );
    stmt.bind({ ":date": date });
    const rows: ExerciseRecord[] = [];
    while (stmt.step()) rows.push(rowToRecord(stmt.getAsObject() as Row));
    stmt.free();
    return rows;
  },

  getByDateRange(
    db: Database,
    startDate: string,
    endDate: string
  ): ExerciseRecord[] {
    const stmt = db.prepare(
      "SELECT * FROM exercise_records WHERE date >= :start AND date <= :end ORDER BY date DESC"
    );
    stmt.bind({ ":start": startDate, ":end": endDate });
    const rows: ExerciseRecord[] = [];
    while (stmt.step()) rows.push(rowToRecord(stmt.getAsObject() as Row));
    stmt.free();
    return rows;
  },

  getDistinctDates(
    db: Database,
    startDate: string,
    endDate: string
  ): string[] {
    const stmt = db.prepare(
      "SELECT DISTINCT date FROM exercise_records WHERE date >= :start AND date <= :end ORDER BY date DESC"
    );
    stmt.bind({ ":start": startDate, ":end": endDate });
    const dates: string[] = [];
    while (stmt.step()) dates.push((stmt.getAsObject() as Row).date as string);
    stmt.free();
    return dates;
  },

  getLatestByExercise(
    db: Database,
    exerciseName: string
  ): ExerciseRecord | null {
    const stmt = db.prepare(
      "SELECT * FROM exercise_records WHERE exercise_name = :name ORDER BY date DESC, rowid DESC LIMIT 1"
    );
    stmt.bind({ ":name": exerciseName });
    if (stmt.step()) {
      const row = rowToRecord(stmt.getAsObject() as Row);
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  getPRByExercise(db: Database, exerciseName: string): ExerciseRecord | null {
    const stmt = db.prepare(
      "SELECT * FROM exercise_records WHERE exercise_name = :name ORDER BY weight_kg DESC LIMIT 1"
    );
    stmt.bind({ ":name": exerciseName });
    if (stmt.step()) {
      const row = rowToRecord(stmt.getAsObject() as Row);
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  getAll(db: Database): ExerciseRecord[] {
    const stmt = db.prepare(
      "SELECT * FROM exercise_records ORDER BY date DESC"
    );
    const rows: ExerciseRecord[] = [];
    while (stmt.step()) rows.push(rowToRecord(stmt.getAsObject() as Row));
    stmt.free();
    return rows;
  },

  count(db: Database): number {
    const stmt = db.prepare("SELECT COUNT(*) as cnt FROM exercise_records");
    stmt.step();
    const cnt = (stmt.getAsObject() as Row).cnt as number;
    stmt.free();
    return cnt;
  },
};
