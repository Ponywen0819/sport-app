import type { ExerciseRecord, CreateExerciseRecordInput } from "@/lib/notion/mappers/exercise-record-mapper";
import type { Exercise } from "@/lib/notion/mappers/exercise-mapper";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function getExerciseRecords(date: string): Promise<ExerciseRecord[]> {
  return apiFetch(`/api/notion/exercise/records?date=${date}`);
}

export function addExerciseRecord(data: CreateExerciseRecordInput): Promise<{ id: string }> {
  return apiFetch("/api/notion/exercise/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function removeExerciseRecord(id: string): Promise<void> {
  return apiFetch(`/api/notion/exercise/records/${id}`, { method: "DELETE" });
}

export function searchExercises(name?: string): Promise<Exercise[]> {
  const url = name
    ? `/api/notion/exercise/exercises?name=${encodeURIComponent(name)}`
    : "/api/notion/exercise/exercises";
  return apiFetch(url);
}

export function getExerciseRecordDates(startDate: string, endDate: string): Promise<string[]> {
  return apiFetch(`/api/notion/exercise/dates?start=${startDate}&end=${endDate}`);
}

export function getLastExerciseRecord(exerciseName: string): Promise<ExerciseRecord | null> {
  return apiFetch(`/api/notion/exercise/records/last?name=${encodeURIComponent(exerciseName)}`);
}

export function getPRExerciseRecord(exerciseName: string): Promise<ExerciseRecord | null> {
  return apiFetch(`/api/notion/exercise/records/pr?name=${encodeURIComponent(exerciseName)}`);
}
