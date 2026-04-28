import type { Database } from "@sqlite.org/sqlite-wasm";
import type { ExerciseRecord } from "@/lib/notion/mappers/exercise-record-mapper";

type Row = Record<string, import("@sqlite.org/sqlite-wasm").SqlValue>;

export type DailyWorkoutSummary = {
  date: string;
  exerciseCount: number;
  totalSets: number;
};

function rowToRecord(row: Row): ExerciseRecord {
  return {
    id: row.id as string,
    exerciseName: row.exercise_name as string,
    exerciseId: (row.exercise_id as string | null) ?? null,
    date: row.date as string,
    weightKg: Number(row.weight_kg) ?? 0,
    reps: Number(row.reps) ?? 0,
    sets: Number(row.sets) ?? 1,
    dropWeightKg: row.drop_weight_kg != null ? Number(row.drop_weight_kg) : null,
    dropReps: row.drop_reps != null ? Number(row.drop_reps) : null,
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
      stmt
        .bind({
          ":id": r.id,
          ":exercise_name": r.exerciseName,
          ":exercise_id": r.exerciseId ?? null,
          ":date": r.date,
          ":weight_kg": r.weightKg,
          ":reps": r.reps,
          ":sets": r.sets,
          ":drop_weight_kg": r.dropWeightKg ?? null,
          ":drop_reps": r.dropReps ?? null,
        })
        .stepReset();
    }
    stmt.finalize();
  },

  upsert(db: Database, record: ExerciseRecord): void {
    this.upsertMany(db, [record]);
  },

  delete(db: Database, id: string): void {
    db.exec({ sql: "DELETE FROM exercise_records WHERE id = ?", bind: [id] });
  },

  getByDate(db: Database, date: string): ExerciseRecord[] {
    const stmt = db.prepare(
      "SELECT * FROM exercise_records WHERE date = :date ORDER BY rowid DESC"
    );
    stmt.bind({ ":date": date });
    const rows: ExerciseRecord[] = [];
    while (stmt.step()) rows.push(rowToRecord(stmt.get({}) as Row));
    stmt.finalize();
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
    while (stmt.step()) rows.push(rowToRecord(stmt.get({}) as Row));
    stmt.finalize();
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
    while (stmt.step()) dates.push((stmt.get({}) as Row).date as string);
    stmt.finalize();
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
      const row = rowToRecord(stmt.get({}) as Row);
      stmt.finalize();
      return row;
    }
    stmt.finalize();
    return null;
  },

  getPRByExercise(db: Database, exerciseName: string): ExerciseRecord | null {
    const stmt = db.prepare(
      "SELECT * FROM exercise_records WHERE exercise_name = :name ORDER BY weight_kg DESC LIMIT 1"
    );
    stmt.bind({ ":name": exerciseName });
    if (stmt.step()) {
      const row = rowToRecord(stmt.get({}) as Row);
      stmt.finalize();
      return row;
    }
    stmt.finalize();
    return null;
  },

  getAll(db: Database): ExerciseRecord[] {
    const stmt = db.prepare(
      "SELECT * FROM exercise_records ORDER BY date DESC"
    );
    const rows: ExerciseRecord[] = [];
    while (stmt.step()) rows.push(rowToRecord(stmt.get({}) as Row));
    stmt.finalize();
    return rows;
  },

  count(db: Database): number {
    const stmt = db.prepare("SELECT COUNT(*) as cnt FROM exercise_records");
    stmt.step();
    const cnt = Number((stmt.get({}) as Row).cnt);
    stmt.finalize();
    return cnt;
  },

  getProgressByExercise(
    db: Database,
    exerciseName: string,
    weeks: number
  ): ExerciseRecord[] {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - weeks * 7);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const stmt = db.prepare(
      `SELECT * FROM exercise_records
       WHERE exercise_name LIKE :name
         AND date >= :from
         AND date <= :to
       ORDER BY date ASC`
    );
    stmt.bind({
      ":name": `%${exerciseName}%`,
      ":from": fmt(from),
      ":to": fmt(to),
    });

    const byDay = new Map<string, ExerciseRecord>();
    while (stmt.step()) {
      const record = rowToRecord(stmt.get({}) as Row);
      const existing = byDay.get(record.date);
      if (!existing || record.weightKg > existing.weightKg) {
        byDay.set(record.date, record);
      }
    }
    stmt.finalize();
    return Array.from(byDay.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  },

  getDailyWorkoutSummary(
    db: Database,
    from: string,
    to: string
  ): DailyWorkoutSummary[] {
    const stmt = db.prepare(
      `SELECT date,
              COUNT(*) AS exercise_count,
              COALESCE(SUM(CASE WHEN sets > 0 THEN sets ELSE 1 END), 0) AS total_sets
       FROM exercise_records
       WHERE date >= :from AND date <= :to
       GROUP BY date
       ORDER BY date ASC`
    );
    stmt.bind({ ":from": from, ":to": to });
    const rows: DailyWorkoutSummary[] = [];
    while (stmt.step()) {
      const row = stmt.get({}) as Row;
      rows.push({
        date: row.date as string,
        exerciseCount: Number(row.exercise_count),
        totalSets: Number(row.total_sets),
      });
    }
    stmt.finalize();
    return rows;
  },
};
