// src/stores/counter-store.ts
import { createStore } from "zustand/vanilla";
import { PrismaClient, User } from "@prisma/client";

export type AuthState = { user: User | null };

type LoginPayload = {
  email: string;
  password: string;
};

type LoginFunction = (payload: LoginPayload) => Promise<User | null>;

export type AuthActions = {
  login: LoginFunction;
  logout: () => void;
};

export type AuthStore = AuthState & AuthActions;

export const defaultInitState: AuthState = {
  user: null,
};

const handleLogin: LoginFunction = async (payload) => {
  const { email, password } = payload;
};

const Logout = () => {
  return null;
};

export const createAuthStore = (initState: AuthState = defaultInitState) => {
  return createStore<AuthStore>()((set) => ({
    ...initState,
    login: handleLogin,
    logout: Logout,
  }));
};
