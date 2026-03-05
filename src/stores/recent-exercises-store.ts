import { createStore } from "zustand/vanilla";
import type { Exercise } from "@/lib/notion/mappers/exercise-mapper";

const MAX_RECENT = 10;

export type RecentExercisesStore = {
  recentExercises: Exercise[];
  addRecentExercise: (exercise: Exercise) => void;
};

export const LOCAL_STORAGE_KEY = "recent-exercises";

export const createRecentExercisesStore = () =>
  createStore<RecentExercisesStore>()((set) => ({
    recentExercises: [],
    addRecentExercise: (exercise) => {
      set((state) => {
        const filtered = state.recentExercises.filter((e) => e.id !== exercise.id);
        const updated = [exercise, ...filtered].slice(0, MAX_RECENT);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return { recentExercises: updated };
      });
    },
  }));
