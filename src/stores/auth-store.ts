// src/stores/counter-store.ts
import { createStore } from "zustand";
import {
  AuthTokenPayloadSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  PublicUserSchema,
} from "@/schema/auth-schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import Cookies from "js-cookie";

type PublicUser = z.infer<typeof PublicUserSchema>;

export type AuthState = { user: PublicUser | null; token: string | null };

type LoginPayload = z.infer<typeof LoginRequestSchema>;

type LoginFunction = (payload: LoginPayload) => Promise<PublicUser | null>;

export type AuthActions = {
  login: LoginFunction;
  logout: () => void;
};

export type AuthStore = AuthState & AuthActions;

export const defaultInitState: AuthState = {
  user: null,
  token: null,
};

export const createAuthStore = (initState: AuthState = defaultInitState) => {
  return createStore<AuthStore>()((set) => ({
    ...initState,
    login: async (payload: LoginPayload) => {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        return null;
      }

      try {
        const json = await res.json();
        const { token } = LoginResponseSchema.parse(json);
        const tokenPayload = jwt.decode(token);

        const { email, id, name, exp } =
          AuthTokenPayloadSchema.parse(tokenPayload);

        const user = PublicUserSchema.parse({
          email,
          id,
          name,
        });

        set({ user, token });

        Cookies.set("token", token, { expires: new Date(exp * 1000) });

        return user;
      } catch (error) {
        return null;
      }
    },
    logout: () => {
      set({ user: null, token: null });
      Cookies.remove("token");
    },
  }));
};
