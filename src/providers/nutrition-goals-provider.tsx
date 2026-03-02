"use client";

import { type ReactNode, createContext, useRef, useContext, useEffect } from "react";
import { useStore } from "zustand";
import {
  type NutritionGoalsStore,
  createNutritionGoalsStore,
  LOCAL_STORAGE_KEY,
} from "@/stores/nutrition-goals-store";

export type NutritionGoalsStoreApi = ReturnType<typeof createNutritionGoalsStore>;

const NutritionGoalsContext = createContext<NutritionGoalsStoreApi | undefined>(undefined);

export function NutritionGoalsProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<NutritionGoalsStoreApi>(undefined);
  if (!storeRef.current) {
    storeRef.current = createNutritionGoalsStore();
  }

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const goals = JSON.parse(stored);
        storeRef.current!.setState({ goals });
      } catch {
        // 忽略損毀的 JSON
      }
    }
  }, []);

  return (
    <NutritionGoalsContext.Provider value={storeRef.current}>
      {children}
    </NutritionGoalsContext.Provider>
  );
}

export function useNutritionGoals<T>(selector: (store: NutritionGoalsStore) => T): T {
  const context = useContext(NutritionGoalsContext);
  if (!context) {
    throw new Error("useNutritionGoals must be used within NutritionGoalsProvider");
  }
  return useStore(context, selector);
}
