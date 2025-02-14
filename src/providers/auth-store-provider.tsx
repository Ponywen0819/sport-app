"use client";

import {
  type ReactNode,
  createContext,
  useRef,
  useContext,
  PropsWithChildren,
} from "react";
import { useStore } from "zustand";

import { type AuthStore, createAuthStore } from "@/stores/auth-store";

export type CounterStoreApi = ReturnType<typeof createAuthStore>;

type ProviderContextType = CounterStoreApi | undefined;

export const CounterStoreContext =
  createContext<ProviderContextType>(undefined);

export type AuthStoreProviderProps = PropsWithChildren<{}>;

export const AuthStoreProvider = (props: AuthStoreProviderProps) => {
  const { children } = props;
  const storeRef = useRef<CounterStoreApi>(undefined);

  if (!storeRef.current) {
    storeRef.current = createAuthStore();
  }

  return (
    <CounterStoreContext.Provider value={storeRef.current}>
      {children}
    </CounterStoreContext.Provider>
  );
};

export const useAuthStore = <T,>(selector: (store: AuthStore) => T): T => {
  const context = useContext(CounterStoreContext);

  if (!context) {
    throw new Error(`useAuthStore must be used within AuthStoreProvider`);
  }

  return useStore(context, selector);
};
