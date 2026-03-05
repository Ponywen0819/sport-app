import { NextRequest, NextResponse } from "next/server";
import { MealItemsRepository } from "@/lib/notion/repositories/meal-items";
import { getNutritionConfig, notConfigured } from "../../../_config";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const config = await getNutritionConfig();
  if (!config) return notConfigured();

  const { id } = await params;
  const data = await req.json();
  const repo = new MealItemsRepository(config.client, config.mealItemsDatabaseId);
  await repo.update(id, data);
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const config = await getNutritionConfig();
  if (!config) return notConfigured();

  const { id } = await params;
  const repo = new MealItemsRepository(config.client, config.mealItemsDatabaseId);
  await repo.delete(id);
  return new NextResponse(null, { status: 204 });
}
