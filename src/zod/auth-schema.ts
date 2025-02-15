import { z } from "zod";

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
});

export const PublicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});

export const AuthTokenPayloadSchema = z
  .object({
    iat: z.number(),
    exp: z.number(),
  })
  .merge(PublicUserSchema);
