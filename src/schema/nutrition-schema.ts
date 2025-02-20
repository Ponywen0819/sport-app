import { i } from "motion/react-client";
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

export const CreateFoodRequestSchema = z.object({
  name: z.string(),
  weight: z.number(),
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
  transFat: z.number().optional(),
  saturatedFat: z.number().optional(),
  monounsaturatedFat: z.number().optional(),
  polyunsaturatedFat: z.number().optional(),
  sugar: z.number().optional(),
  dietaryFiber: z.number().optional(),
  sodium: z.number().optional(),
  potassium: z.number().optional(),
});

const OnlyIdSchema = z.object({
  id: z.string().uuid(),
});

export const CreateFoodResponseSchema = OnlyIdSchema;

export const UpdateFoodRequestSchema =
  CreateFoodRequestSchema.partial().merge(OnlyIdSchema);

export const UpdateFoodResponseSchema = OnlyIdSchema;

export const DeleteFoodRequestSchema = OnlyIdSchema;

export const DeleteFoodResponseSchema = OnlyIdSchema;

export const GetFoodRequestSchema = OnlyIdSchema;

export const GetFoodResponseSchema =
  CreateFoodRequestSchema.merge(OnlyIdSchema);
