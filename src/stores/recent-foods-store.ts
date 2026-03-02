import { createStore } from "zustand/vanilla";
import type { Food } from "@/lib/notion/mappers/food-mapper";

const MAX_RECENT = 10;

export type RecentFoodsStore = {
  recentFoods: Food[];
  addRecentFood: (food: Food) => void;
};

export const LOCAL_STORAGE_KEY = "recent-foods";

export const createRecentFoodsStore = () =>
  createStore<RecentFoodsStore>()((set) => ({
    recentFoods: [],
    addRecentFood: (food) => {
      set((state) => {
        const filtered = state.recentFoods.filter((f) => f.id !== food.id);
        const updated = [food, ...filtered].slice(0, MAX_RECENT);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return { recentFoods: updated };
      });
    },
  }));
