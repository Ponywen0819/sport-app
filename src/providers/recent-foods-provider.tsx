"use client";

import { type ReactNode, createContext, useRef, useContext, useEffect } from "react";
import { useStore } from "zustand";
import {
  type RecentFoodsStore,
  createRecentFoodsStore,
  LOCAL_STORAGE_KEY,
} from "@/stores/recent-foods-store";

export type RecentFoodsStoreApi = ReturnType<typeof createRecentFoodsStore>;

const RecentFoodsContext = createContext<RecentFoodsStoreApi | undefined>(undefined);

export function RecentFoodsProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<RecentFoodsStoreApi>(undefined);
  if (!storeRef.current) {
    storeRef.current = createRecentFoodsStore();
  }

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const recentFoods = JSON.parse(stored);
        storeRef.current!.setState({ recentFoods });
      } catch {
        // 忽略損毀的 JSON
      }
    }
  }, []);

  return (
    <RecentFoodsContext.Provider value={storeRef.current}>
      {children}
    </RecentFoodsContext.Provider>
  );
}

export function useRecentFoods<T>(selector: (store: RecentFoodsStore) => T): T {
  const context = useContext(RecentFoodsContext);
  if (!context) {
    throw new Error("useRecentFoods must be used within RecentFoodsProvider");
  }
  return useStore(context, selector);
}
