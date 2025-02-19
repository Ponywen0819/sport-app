"use client";

import {
  createContext,
  useRef,
  useContext,
  PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import jwt from "jsonwebtoken";
import Cookies from "js-cookie";
import { useStore } from "zustand";

import { type AuthStore, createAuthStore } from "@/stores/auth-store";
import { AuthTokenPayloadSchema, PublicUserSchema } from "@/schema/auth-schema";

export type CounterStoreApi = ReturnType<typeof createAuthStore>;

type ProviderContextType = CounterStoreApi | undefined;

export const AuthStoreContext = createContext<ProviderContextType>(undefined);

export type AuthStoreProviderProps = PropsWithChildren<{}>;

export const AuthStoreProvider = (props: AuthStoreProviderProps) => {
  const { children } = props;
  const storeRef = useRef<CounterStoreApi>(undefined);

  if (!storeRef.current) {
    storeRef.current = createAuthStore();
  }

  useEffect(() => {
    if (!storeRef.current) return;
    const [user, token] = getUserInToken();

    storeRef.current.setState({ user, token });
  }, []);

  return (
    <AuthStoreContext.Provider value={storeRef.current}>
      {children}
    </AuthStoreContext.Provider>
  );
};

export const useAuthStore = <T,>(selector: (store: AuthStore) => T): T => {
  const context = useContext(AuthStoreContext);

  if (!context) {
    throw new Error(`useAuthStore must be used within AuthStoreProvider`);
  }

  return useStore(context, selector);
};

export const selectIsLogin = () => {
  return useAuthStore((store) => store.user !== null);
};

const getUserInToken = () => {
  const token = Cookies.get("token");
  if (!token) {
    return [null, null] as const;
  }
  const tokenPayload = AuthTokenPayloadSchema.safeParse(jwt.decode(token));

  if (!tokenPayload.success) {
    return [null, null] as const;
  }

  const { email, id, name } = tokenPayload.data;

  const user = PublicUserSchema.parse({
    email,
    id,
    name,
  });

  return [user, token] as const;
};
