import type {
  ExerciseRecord,
  CreateExerciseRecordInput,
} from "@/lib/notion/mappers/exercise-record-mapper";
import type { Exercise } from "@/lib/notion/mappers/exercise-mapper";
import { getDatabase, persistDatabase } from "@/lib/sqljs/database";
import {
  exerciseRecordsLocalRepo,
  type DailyWorkoutSummary,
} from "@/lib/sqljs/repositories/exercise-records";
import { exercisesLocalRepo } from "@/lib/sqljs/repositories/exercises";

export type { DailyWorkoutSummary };

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
  return exerciseRecordsLocalRepo.getDistinctDates(db, startDate, endDate);
}

export async function getLastExerciseRecord(
  exerciseName: string,
): Promise<ExerciseRecord | null> {
  const db = await getDatabase();
  return exerciseRecordsLocalRepo.getLatestByExercise(db, exerciseName);
}

export async function getPRExerciseRecord(
  exerciseName: string,
): Promise<ExerciseRecord | null> {
  const db = await getDatabase();
  return exerciseRecordsLocalRepo.getPRByExercise(db, exerciseName);
}

export async function getExerciseProgress(
  exerciseName: string,
  weeks = 12,
): Promise<ExerciseRecord[]> {
  const db = await getDatabase();
  return exerciseRecordsLocalRepo.getProgressByExercise(db, exerciseName, weeks);
}

export async function getWeeklyWorkoutSummary(
  from: string,
  to: string,
): Promise<DailyWorkoutSummary[]> {
  const db = await getDatabase();
  return exerciseRecordsLocalRepo.getDailyWorkoutSummary(db, from, to);
}
