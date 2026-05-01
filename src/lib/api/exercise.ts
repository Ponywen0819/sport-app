import type {
  ExerciseRecord,
  CreateExerciseRecordInput,
} from "@/lib/notion/mappers/exercise-record-mapper";
import type {
  Exercise,
  ExerciseInput,
} from "@/lib/notion/mappers/exercise-mapper";
import { getDatabase, persistDatabase } from "@/lib/sqljs/database";
import {
  exerciseRecordsLocalRepo,
  type DailyWorkoutSummary,
} from "@/lib/sqljs/repositories/exercise-records";
import { exercisesLocalRepo } from "@/lib/sqljs/repositories/exercises";
import {
  workoutsLocalRepo,
  type ExerciseSetType,
  type WorkoutBlockType,
  type WorkoutSessionWithBlocks,
} from "@/lib/sqljs/repositories/workouts";

export type { DailyWorkoutSummary };

type Row = Record<string, import("@sqlite.org/sqlite-wasm").SqlValue>;

export type CreateWorkoutSetInput = {
  exerciseId: string | null;
  exerciseName: string;
  roundIndex: number;
  orderIndex: number;
  weightKg: number;
  reps: number;
  setType?: ExerciseSetType;
  note?: string;
};

export type AddWorkoutBlockInput = {
  date: string;
  type: WorkoutBlockType;
  rounds: number;
  note?: string;
  sets: CreateWorkoutSetInput[];
};

export type AddWorkoutSetToBlockInput = {
  blockId: string;
  exerciseId: string | null;
  exerciseName: string;
  roundIndex: number;
  orderIndex: number;
  weightKg: number;
  reps: number;
  setType?: ExerciseSetType;
  note?: string;
};

export type AddWorkoutSetsToBlockInput = {
  blockId: string;
  sets: Omit<AddWorkoutSetToBlockInput, "blockId">[];
};

const rowToExerciseRecord = (row: Row): ExerciseRecord => ({
  id: row.id as string,
  exerciseName: row.exercise_name as string,
  exerciseId: (row.exercise_id as string | null) ?? null,
  date: row.date as string,
  weightKg: Number(row.weight_kg) || 0,
  reps: Number(row.reps) || 0,
  sets: Number(row.sets) || 1,
  dropWeightKg: row.drop_weight_kg != null ? Number(row.drop_weight_kg) : null,
  dropReps: row.drop_reps != null ? Number(row.drop_reps) : null,
});

export async function getWorkoutSession(
  date: string,
): Promise<WorkoutSessionWithBlocks | null> {
  const db = await getDatabase();
  return workoutsLocalRepo.getSessionByDate(db, date);
}

export async function addWorkoutBlock(
  data: AddWorkoutBlockInput,
): Promise<{ sessionId: string; blockId: string }> {
  const db = await getDatabase();
  const existingSession = workoutsLocalRepo.getSessionByDate(db, data.date);
  const sessionId = existingSession?.id ?? crypto.randomUUID();
  const blockId = crypto.randomUUID();
  const now = new Date().toISOString();

  if (!existingSession) {
    workoutsLocalRepo.upsertSession(db, {
      id: sessionId,
      date: data.date,
      startedAt: now,
      endedAt: null,
      note: "",
    });
  }

  workoutsLocalRepo.upsertBlock(db, {
    id: blockId,
    sessionId,
    orderIndex: existingSession?.blocks.length ?? 0,
    type: data.type,
    rounds: Math.max(1, data.rounds),
    note: data.note ?? "",
  });

  workoutsLocalRepo.upsertSets(
    db,
    data.sets.map((set) => ({
      id: crypto.randomUUID(),
      blockId,
      exerciseId: set.exerciseId,
      exerciseName: set.exerciseName,
      roundIndex: set.roundIndex,
      orderIndex: set.orderIndex,
      weightKg: set.weightKg,
      reps: set.reps,
      setType: set.setType ?? "normal",
      note: set.note ?? "",
      legacyRecordId: null,
    })),
  );

  await persistDatabase();
  return { sessionId, blockId };
}

export async function removeWorkoutBlock(id: string): Promise<void> {
  const db = await getDatabase();
  workoutsLocalRepo.deleteBlock(db, id);
  await persistDatabase();
}

export async function reorderWorkoutBlocks(
  sessionId: string,
  blockIds: string[],
): Promise<void> {
  const db = await getDatabase();
  workoutsLocalRepo.reorderBlocks(db, sessionId, blockIds);
  await persistDatabase();
}

export async function reorderWorkoutBlockRounds(
  blockId: string,
  roundIndices: number[],
): Promise<void> {
  const db = await getDatabase();
  workoutsLocalRepo.reorderBlockRounds(db, blockId, roundIndices);
  await persistDatabase();
}

export async function addWorkoutSetToBlock(
  data: AddWorkoutSetToBlockInput,
): Promise<{ id: string }> {
  const result = await addWorkoutSetsToBlock({
    blockId: data.blockId,
    sets: [
      {
        exerciseId: data.exerciseId,
        exerciseName: data.exerciseName,
        roundIndex: data.roundIndex,
        orderIndex: data.orderIndex,
        weightKg: data.weightKg,
        reps: data.reps,
        setType: data.setType,
        note: data.note,
      },
    ],
  });

  return { id: result.ids[0] };
}

export async function addWorkoutSetsToBlock(
  data: AddWorkoutSetsToBlockInput,
): Promise<{ ids: string[] }> {
  const db = await getDatabase();
  const ids = data.sets.map(() => crypto.randomUUID());

  workoutsLocalRepo.upsertSets(
    db,
    data.sets.map((set, index) => ({
      id: ids[index],
      blockId: data.blockId,
      exerciseId: set.exerciseId,
      exerciseName: set.exerciseName,
      roundIndex: set.roundIndex,
      orderIndex: set.orderIndex,
      weightKg: set.weightKg,
      reps: set.reps,
      setType: set.setType ?? "normal",
      note: set.note ?? "",
      legacyRecordId: null,
    })),
  );

  db.exec({
    sql: `
      UPDATE workout_blocks
      SET rounds = MAX(rounds, :rounds),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = :block_id
    `,
    bind: {
      ":rounds":
        data.sets.reduce(
          (maxRound, set) => Math.max(maxRound, set.roundIndex),
          -1,
        ) + 1,
      ":block_id": data.blockId,
    },
  });

  await persistDatabase();
  return { ids };
}

export async function getExerciseRecords(
  date: string,
): Promise<ExerciseRecord[]> {
  const db = await getDatabase();
  return exerciseRecordsLocalRepo.getByDate(db, date);
}

export async function addExerciseRecord(
  data: CreateExerciseRecordInput,
): Promise<{ id: string }> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  exerciseRecordsLocalRepo.upsert(db, { id, ...data });
  await persistDatabase();
  return { id };
}

export async function removeExerciseRecord(id: string): Promise<void> {
  const db = await getDatabase();
  exerciseRecordsLocalRepo.delete(db, id);
  await persistDatabase();
}

export async function searchExercises(name?: string): Promise<Exercise[]> {
  const db = await getDatabase();
  return exercisesLocalRepo.search(db, name);
}

export async function getExerciseRecordDates(
  startDate: string,
  endDate: string,
): Promise<string[]> {
  const db = await getDatabase();
  const stmt = db.prepare(
    `SELECT DISTINCT date
     FROM workout_sessions
     WHERE date >= :start AND date <= :end
     ORDER BY date DESC`,
  );
  stmt.bind({ ":start": startDate, ":end": endDate });
  const dates: string[] = [];
  while (stmt.step()) dates.push((stmt.get({}) as Row).date as string);
  stmt.finalize();
  return dates;
}

export async function getLastExerciseRecord(
  exerciseName: string,
): Promise<ExerciseRecord | null> {
  const db = await getDatabase();
  const stmt = db.prepare(
    `SELECT
       es.id,
       es.exercise_name,
       es.exercise_id,
       ws.date,
       es.weight_kg,
       es.reps,
       1 AS sets,
       NULL AS drop_weight_kg,
       NULL AS drop_reps
     FROM exercise_sets es
     JOIN workout_blocks wb ON wb.id = es.block_id
     JOIN workout_sessions ws ON ws.id = wb.session_id
     WHERE es.exercise_name = :name AND es.set_type != 'drop'
     ORDER BY ws.date DESC, es.created_at DESC, es.rowid DESC
     LIMIT 1`,
  );
  stmt.bind({ ":name": exerciseName });
  const record = stmt.step()
    ? rowToExerciseRecord(stmt.get({}) as Row)
    : null;
  stmt.finalize();
  return record;
}

export async function createExercise(data: ExerciseInput): Promise<Exercise> {
  const db = await getDatabase();
  const exercise: Exercise = { id: crypto.randomUUID(), ...data };
  exercisesLocalRepo.upsert(db, exercise);
  await persistDatabase();
  return exercise;
}

export async function updateExercise(
  id: string,
  data: ExerciseInput,
): Promise<Exercise> {
  const db = await getDatabase();
  const exercise: Exercise = { id, ...data };
  exercisesLocalRepo.upsert(db, exercise);
  await persistDatabase();
  return exercise;
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await getDatabase();
  exercisesLocalRepo.delete(db, id);
  await persistDatabase();
}

export async function getPRExerciseRecord(
  exerciseName: string,
): Promise<ExerciseRecord | null> {
  const db = await getDatabase();
  const stmt = db.prepare(
    `SELECT
       es.id,
       es.exercise_name,
       es.exercise_id,
       ws.date,
       es.weight_kg,
       es.reps,
       1 AS sets,
       NULL AS drop_weight_kg,
       NULL AS drop_reps
     FROM exercise_sets es
     JOIN workout_blocks wb ON wb.id = es.block_id
     JOIN workout_sessions ws ON ws.id = wb.session_id
     WHERE es.exercise_name = :name AND es.set_type != 'drop'
     ORDER BY es.weight_kg DESC, es.reps DESC, ws.date DESC
     LIMIT 1`,
  );
  stmt.bind({ ":name": exerciseName });
  const record = stmt.step()
    ? rowToExerciseRecord(stmt.get({}) as Row)
    : null;
  stmt.finalize();
  return record;
}

export async function getExerciseProgress(
  exerciseName: string,
  weeks = 12,
): Promise<ExerciseRecord[]> {
  const db = await getDatabase();
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - weeks * 7);
  const fmt = (date: Date) => date.toISOString().slice(0, 10);

  const stmt = db.prepare(
    `SELECT
       es.id,
       es.exercise_name,
       es.exercise_id,
       ws.date,
       es.weight_kg,
       es.reps,
       1 AS sets,
       NULL AS drop_weight_kg,
       NULL AS drop_reps
     FROM exercise_sets es
     JOIN workout_blocks wb ON wb.id = es.block_id
     JOIN workout_sessions ws ON ws.id = wb.session_id
     WHERE es.exercise_name LIKE :name
       AND es.set_type != 'drop'
       AND ws.date >= :from
       AND ws.date <= :to
     ORDER BY ws.date ASC, es.weight_kg DESC`,
  );
  stmt.bind({
    ":name": `%${exerciseName}%`,
    ":from": fmt(from),
    ":to": fmt(to),
  });

  const byDay = new Map<string, ExerciseRecord>();
  while (stmt.step()) {
    const record = rowToExerciseRecord(stmt.get({}) as Row);
    const existing = byDay.get(record.date);
    if (!existing || record.weightKg > existing.weightKg) {
      byDay.set(record.date, record);
    }
  }
  stmt.finalize();
  return Array.from(byDay.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export async function getWeeklyWorkoutSummary(
  from: string,
  to: string,
): Promise<DailyWorkoutSummary[]> {
  const db = await getDatabase();
  const stmt = db.prepare(
    `SELECT
       ws.date,
       COUNT(DISTINCT wb.id) AS exercise_count,
       COUNT(es.id) AS total_sets
     FROM workout_sessions ws
     LEFT JOIN workout_blocks wb ON wb.session_id = ws.id
     LEFT JOIN exercise_sets es ON es.block_id = wb.id
     WHERE ws.date >= :from AND ws.date <= :to
     GROUP BY ws.date
     ORDER BY ws.date ASC`,
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
}
