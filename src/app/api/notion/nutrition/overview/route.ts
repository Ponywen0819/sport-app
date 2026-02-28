import { NextRequest, NextResponse } from "next/server";
import { MealItemsRepository } from "@/lib/notion/repositories/meal-items";
import { getNutritionConfig, notConfigured } from "../../_config";

export async function GET(req: NextRequest) {
  const config = await getNutritionConfig();
  if (!config) return notConfigured();

  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });

  const repo = new MealItemsRepository(config.client, config.mealItemsDatabaseId);
  const items = await repo.getByDate(date);
  const overview = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      fat: acc.fat + item.fat,
      carbs: acc.carbs + item.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );
  return NextResponse.json(overview);
}
