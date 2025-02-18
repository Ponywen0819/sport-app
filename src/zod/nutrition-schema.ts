import { z } from "zod";

export const GetNutritionOverRequestSchema = z.object({
  date: z.string().date(),
});

export const GetNutritionOverResponseSchema = z.object({
  nutrition: z.object({
    calories: z.number(),
    carbs: z.number(),
    fat: z.number(),
    protein: z.number(),
  }),
});
