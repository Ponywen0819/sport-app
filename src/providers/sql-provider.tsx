"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Database } from "@sqlite.org/sqlite-wasm";
import {
  getDatabase,
  persistDatabase,
  exercisesLocalRepo,
  exerciseRecordsLocalRepo,
  foodsLocalRepo,
  mealItemsLocalRepo,
  bodyIndexesLocalRepo,
} from "@/lib/sqljs";
import type { Exercise } from "@/lib/notion/mappers/exercise-mapper";
import type { ExerciseRecord } from "@/lib/notion/mappers/exercise-record-mapper";
import type { Food } from "@/lib/notion/mappers/food-mapper";
import type { MealItem } from "@/lib/notion/mappers/meal-item-mapper";
import type { BodyIndex } from "@/lib/notion/mappers/body-index-mapper";

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

export type SqlContextValue = {
  /** Whether the database has finished initializing. */
  isReady: boolean;
  /** Raw sql.js Database instance (for advanced use). */
  db: Database | null;
  /** Persist the in-memory DB to IndexedDB. Called automatically, but can be triggered manually. */
  save: () => Promise<void>;

  // --- Exercises ---
  upsertExercises: (items: Exercise[]) => void;
  searchExercises: (name?: string) => Exercise[];

  // --- Exercise Records ---
  upsertExerciseRecords: (items: ExerciseRecord[]) => void;
  upsertExerciseRecord: (item: ExerciseRecord) => void;
  deleteExerciseRecord: (id: string) => void;
  getExerciseRecordsByDate: (date: string) => ExerciseRecord[];
  getExerciseRecordsByDateRange: (
    startDate: string,
    endDate: string
  ) => ExerciseRecord[];
  getExerciseRecordDates: (startDate: string, endDate: string) => string[];
  getLatestExerciseRecord: (exerciseName: string) => ExerciseRecord | null;
  getPRExerciseRecord: (exerciseName: string) => ExerciseRecord | null;
  getAllExerciseRecords: () => ExerciseRecord[];

  // --- Foods ---
  upsertFoods: (items: Food[]) => void;
  upsertFood: (item: Food) => void;
  deleteFood: (id: string) => void;
  searchFoods: (name?: string) => Food[];
  getFoodById: (id: string) => Food | null;

  // --- Meal Items ---
  upsertMealItems: (items: MealItem[]) => void;
  upsertMealItem: (item: MealItem) => void;
  deleteMealItem: (id: string) => void;
  updateMealItem: (
    id: string,
    data: Pick<MealItem, "intake" | "calories" | "protein" | "fat" | "carbs">
  ) => void;
  getMealItemsByDate: (date: string) => MealItem[];
  getMealItemsByDateAndType: (
    date: string,
    mealType: MealItem["mealType"]
  ) => MealItem[];
  getMealItemsByDateRange: (from: string, to: string) => MealItem[];

  // --- Body Indexes ---
  upsertBodyIndexes: (items: BodyIndex[]) => void;
  upsertBodyIndex: (item: BodyIndex) => void;
  getLatestBodyIndex: () => BodyIndex | null;
  getBodyIndexByDate: (date: string) => BodyIndex | null;
  getBodyIndexHistory: (limit?: number) => BodyIndex[];
  getAllBodyIndexes: () => BodyIndex[];
};

const SqlContext = createContext<SqlContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const PERSIST_INTERVAL_MS = 30_000; // auto-save every 30 s

export function SqlJsProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const dbRef = useRef<Database | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDatabase().then((db) => {
      if (cancelled) return;
      dbRef.current = db;
      setIsReady(true);
    });

    // Auto-persist on a fixed interval
    saveTimerRef.current = setInterval(() => {
      persistDatabase().catch(console.error);
    }, PERSIST_INTERVAL_MS);

    // Persist before the tab/window closes
    const handleUnload = () => { persistDatabase(); };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      cancelled = true;
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  const save = useCallback(() => persistDatabase(), []);

  // Helper to guard calls before DB is ready
  function requireDb(): Database {
    if (!dbRef.current) throw new Error("SqlJs DB not ready");
    return dbRef.current;
  }

  // Build the context value with all repo method wrappers
  const value: SqlContextValue = {
    isReady,
    db: dbRef.current,
    save,

    // Exercises
    upsertExercises: (items) => exercisesLocalRepo.upsertMany(requireDb(), items),
    searchExercises: (name) => (isReady ? exercisesLocalRepo.search(requireDb(), name) : []),

    // Exercise Records
    upsertExerciseRecords: (items) => exerciseRecordsLocalRepo.upsertMany(requireDb(), items),
    upsertExerciseRecord: (item) => exerciseRecordsLocalRepo.upsert(requireDb(), item),
    deleteExerciseRecord: (id) => exerciseRecordsLocalRepo.delete(requireDb(), id),
    getExerciseRecordsByDate: (date) =>
      isReady ? exerciseRecordsLocalRepo.getByDate(requireDb(), date) : [],
    getExerciseRecordsByDateRange: (start, end) =>
      isReady ? exerciseRecordsLocalRepo.getByDateRange(requireDb(), start, end) : [],
    getExerciseRecordDates: (start, end) =>
      isReady ? exerciseRecordsLocalRepo.getDistinctDates(requireDb(), start, end) : [],
    getLatestExerciseRecord: (name) =>
      isReady ? exerciseRecordsLocalRepo.getLatestByExercise(requireDb(), name) : null,
    getPRExerciseRecord: (name) =>
      isReady ? exerciseRecordsLocalRepo.getPRByExercise(requireDb(), name) : null,
    getAllExerciseRecords: () =>
      isReady ? exerciseRecordsLocalRepo.getAll(requireDb()) : [],

    // Foods
    upsertFoods: (items) => foodsLocalRepo.upsertMany(requireDb(), items),
    upsertFood: (item) => foodsLocalRepo.upsert(requireDb(), item),
    deleteFood: (id) => foodsLocalRepo.delete(requireDb(), id),
    searchFoods: (name) => (isReady ? foodsLocalRepo.search(requireDb(), name) : []),
    getFoodById: (id) => (isReady ? foodsLocalRepo.getById(requireDb(), id) : null),

    // Meal Items
    upsertMealItems: (items) => mealItemsLocalRepo.upsertMany(requireDb(), items),
    upsertMealItem: (item) => mealItemsLocalRepo.upsert(requireDb(), item),
    deleteMealItem: (id) => mealItemsLocalRepo.delete(requireDb(), id),
    updateMealItem: (id, data) => mealItemsLocalRepo.update(requireDb(), id, data),
    getMealItemsByDate: (date) =>
      isReady ? mealItemsLocalRepo.getByDate(requireDb(), date) : [],
    getMealItemsByDateAndType: (date, mealType) =>
      isReady ? mealItemsLocalRepo.getByDateAndMealType(requireDb(), date, mealType) : [],
    getMealItemsByDateRange: (from, to) =>
      isReady ? mealItemsLocalRepo.getByDateRange(requireDb(), from, to) : [],

    // Body Indexes
    upsertBodyIndexes: (items) => bodyIndexesLocalRepo.upsertMany(requireDb(), items),
    upsertBodyIndex: (item) => bodyIndexesLocalRepo.upsert(requireDb(), item),
    getLatestBodyIndex: () => (isReady ? bodyIndexesLocalRepo.getLatest(requireDb()) : null),
    getBodyIndexByDate: (date) =>
      isReady ? bodyIndexesLocalRepo.getByDate(requireDb(), date) : null,
    getBodyIndexHistory: (limit) =>
      isReady ? bodyIndexesLocalRepo.getHistory(requireDb(), limit) : [],
    getAllBodyIndexes: () =>
      isReady ? bodyIndexesLocalRepo.getAll(requireDb()) : [],
  };

  return <SqlContext.Provider value={value}>{children}</SqlContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSqlJs(): SqlContextValue {
  const ctx = useContext(SqlContext);
  if (!ctx) throw new Error("useSqlJs must be used within <SqlJsProvider>");
  return ctx;
}
