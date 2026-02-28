"use client";

import {
  type ReactNode,
  createContext,
  useRef,
  useContext,
  useEffect,
} from "react";
import { useStore } from "zustand";
import {
  type NotionStore,
  createNotionStore,
  LOCAL_STORAGE_KEY,
  syncNotionCookies,
} from "@/stores/notion-store";

export type NotionStoreApi = ReturnType<typeof createNotionStore>;

const NotionStoreContext = createContext<NotionStoreApi | undefined>(undefined);

export function NotionStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<NotionStoreApi>(undefined);
  if (!storeRef.current) {
    storeRef.current = createNotionStore();
  }

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        storeRef.current!.setState({ settings });
        syncNotionCookies(settings);
      } catch {
        // 忽略損毀的 JSON
      }
    }
  }, []);

  return (
    <NotionStoreContext.Provider value={storeRef.current}>
      {children}
    </NotionStoreContext.Provider>
  );
}

export function useNotionStore<T>(selector: (store: NotionStore) => T): T {
  const context = useContext(NotionStoreContext);
  if (!context) {
    throw new Error("useNotionStore must be used within NotionStoreProvider");
  }
  return useStore(context, selector);
}
