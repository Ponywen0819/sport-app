import { date, z } from "zod";

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

export const MealTypeEnum = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const GetMealRequestSchema = z.object({
  date: z.string().date(),
  mealType: MealTypeEnum,
});

export const GetMealFoodItemSchema = z.object({
  name: z.string(),
  calories: z.number(),
  carbs: z.number(),
  fat: z.number(),
  protein: z.number(),
});

export const GetMealResponseSchema = z.object({
  date: z.string().date(),
  mealType: MealTypeEnum,
  items: z.array(GetMealFoodItemSchema),
});
