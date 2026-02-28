import { NextRequest, NextResponse } from "next/server";
import { MealItemsRepository } from "@/lib/notion/repositories/meal-items";
import { getNutritionConfig, notConfigured } from "../../_config";

export async function GET(req: NextRequest) {
  const config = await getNutritionConfig();
  if (!config) return notConfigured();

  const date = req.nextUrl.searchParams.get("date");
  const mealType = req.nextUrl.searchParams.get("mealType");
  if (!date || !mealType) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const repo = new MealItemsRepository(config.client, config.mealItemsDatabaseId);
  const items = await repo.getByDateAndMealType(date, mealType as Parameters<typeof repo.getByDateAndMealType>[1]);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const config = await getNutritionConfig();
  if (!config) return notConfigured();

  const data = await req.json();
  const repo = new MealItemsRepository(config.client, config.mealItemsDatabaseId);
  const id = await repo.create(data);
  return NextResponse.json({ id }, { status: 201 });
}
