import { NextRequest, NextResponse } from "next/server";
import { MealItemsRepository } from "@/lib/notion/repositories/meal-items";
import { getNutritionConfig, notConfigured } from "../../_config";

export type DailySummary = {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export async function GET(req: NextRequest) {
  const config = await getNutritionConfig();
  if (!config) return notConfigured();

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "Missing from/to" }, { status: 400 });

  const repo = new MealItemsRepository(config.client, config.mealItemsDatabaseId);
  const items = await repo.getByDateRange(from, to);

  // Group by date
  const byDate = new Map<string, DailySummary>();
  for (const item of items) {
    const existing = byDate.get(item.date) ?? { date: item.date, calories: 0, protein: 0, fat: 0, carbs: 0 };
    byDate.set(item.date, {
      ...existing,
      calories: existing.calories + item.calories,
      protein: existing.protein + item.protein,
      fat: existing.fat + item.fat,
      carbs: existing.carbs + item.carbs,
    });
  }

  const summaries = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  return NextResponse.json(summaries);
}
