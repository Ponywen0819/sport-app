import { createStore } from "zustand/vanilla";

export type NutritionGoals = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type NutritionGoalsStore = {
  goals: NutritionGoals;
  setGoals: (goals: NutritionGoals) => void;
};

export const LOCAL_STORAGE_KEY = "nutrition-goals";

export const defaultNutritionGoals: NutritionGoals = {
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
};

export const createNutritionGoalsStore = () =>
  createStore<NutritionGoalsStore>()((set) => ({
    goals: defaultNutritionGoals,
    setGoals: (goals) => {
      set({ goals });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(goals));
    },
  }));
