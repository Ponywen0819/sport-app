import type { MealItem } from "@/lib/notion/mappers/meal-item-mapper";
import type { Food } from "@/lib/notion/mappers/food-mapper";
import { getDatabase, persistDatabase } from "@/lib/sqljs/database";
import {
  mealItemsLocalRepo,
  type DailySummary,
  type NutritionOverview,
} from "@/lib/sqljs/repositories/meal-items";
import { foodsLocalRepo } from "@/lib/sqljs/repositories/foods";

export type { DailySummary };

export async function getNutritionOverview(
  date: string,
): Promise<NutritionOverview> {
  const db = await getDatabase();
  return mealItemsLocalRepo.getOverviewByDate(db, date);
}

export async function getMealItems(
  date: string,
  mealType: MealItem["mealType"],
): Promise<MealItem[]> {
  const db = await getDatabase();
  return mealItemsLocalRepo.getByDateAndMealType(db, date, mealType);
}

export async function addMealItem(
  data: Omit<MealItem, "id">,
): Promise<{ id: string }> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  mealItemsLocalRepo.upsert(db, { id, ...data });
  await persistDatabase();
  return { id };
}

export async function removeMealItem(id: string): Promise<void> {
  const db = await getDatabase();
  mealItemsLocalRepo.delete(db, id);
  await persistDatabase();
}

export async function updateMealItem(
  id: string,
  data: { intake: number; calories: number; protein: number; fat: number; carbs: number },
): Promise<void> {
  const db = await getDatabase();
  mealItemsLocalRepo.update(db, id, data);
  await persistDatabase();
}

export async function searchFoods(name?: string): Promise<Food[]> {
  const db = await getDatabase();
  return foodsLocalRepo.search(db, name);
}

export async function addFood(
  data: Omit<Food, "id">,
): Promise<{ id: string }> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  foodsLocalRepo.upsert(db, { id, ...data });
  await persistDatabase();
  return { id };
}

export async function getWeeklySummary(
  from: string,
  to: string,
): Promise<DailySummary[]> {
  const db = await getDatabase();
  return mealItemsLocalRepo.getDailySummaryByRange(db, from, to);
}
