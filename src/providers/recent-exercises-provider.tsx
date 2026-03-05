"use client";

import { type ReactNode, createContext, useRef, useContext, useEffect } from "react";
import { useStore } from "zustand";
import {
  type RecentExercisesStore,
  createRecentExercisesStore,
  LOCAL_STORAGE_KEY,
} from "@/stores/recent-exercises-store";

export type RecentExercisesStoreApi = ReturnType<typeof createRecentExercisesStore>;

const RecentExercisesContext = createContext<RecentExercisesStoreApi | undefined>(undefined);

export function RecentExercisesProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<RecentExercisesStoreApi>(undefined);
  if (!storeRef.current) {
    storeRef.current = createRecentExercisesStore();
  }

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const recentExercises = JSON.parse(stored);
        storeRef.current!.setState({ recentExercises });
      } catch {
        // 忽略損毀的 JSON
      }
    }
  }, []);

  return (
    <RecentExercisesContext.Provider value={storeRef.current}>
      {children}
    </RecentExercisesContext.Provider>
  );
}

export function useRecentExercises<T>(selector: (store: RecentExercisesStore) => T): T {
  const context = useContext(RecentExercisesContext);
  if (!context) {
    throw new Error("useRecentExercises must be used within RecentExercisesProvider");
  }
  return useStore(context, selector);
}
