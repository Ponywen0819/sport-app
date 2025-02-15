"use client";

import { createContext, useRef, useContext, PropsWithChildren } from "react";
import jwt from "jsonwebtoken";
import Cookies from "js-cookie";
import { useStore } from "zustand";

import {
  AuthState,
  type AuthStore,
  createAuthStore,
} from "@/stores/auth-store";
import { AuthTokenPayloadSchema, PublicUserSchema } from "@/zod/auth-schema";

export type CounterStoreApi = ReturnType<typeof createAuthStore>;

type ProviderContextType = CounterStoreApi | undefined;

export const CounterStoreContext =
  createContext<ProviderContextType>(undefined);

export type AuthStoreProviderProps = PropsWithChildren<{}>;

export const AuthStoreProvider = (props: AuthStoreProviderProps) => {
  const { children } = props;
  const storeRef = useRef<CounterStoreApi>(undefined);

  if (!storeRef.current) {
    const user = getUserInToken();
    const initState: AuthState = { user };
    storeRef.current = createAuthStore(initState);
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

const getUserInToken = () => {
  const token = Cookies.get("token");
  if (!token) {
    return null;
  }
  const tokenPayload = AuthTokenPayloadSchema.safeParse(jwt.decode(token));

  if (!tokenPayload.success) {
    return null;
  }

  const { email, id, name } = tokenPayload.data;

  const user = PublicUserSchema.parse({
    email,
    id,
    name,
  });

  return user;
};
