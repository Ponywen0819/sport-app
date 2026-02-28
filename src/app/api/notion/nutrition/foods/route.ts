import { NextRequest, NextResponse } from "next/server";
import { FoodsRepository } from "@/lib/notion/repositories/foods";
import { getNutritionConfig, notConfigured } from "../../_config";

export async function GET(req: NextRequest) {
  const config = await getNutritionConfig();
  if (!config) return notConfigured();

  const name = req.nextUrl.searchParams.get("name") ?? undefined;
  const repo = new FoodsRepository(config.client, config.foodsDatabaseId);
  const foods = await repo.search(name);
  return NextResponse.json(foods);
}

export async function POST(req: NextRequest) {
  const config = await getNutritionConfig();
  if (!config) return notConfigured();

  const data = await req.json();
  const repo = new FoodsRepository(config.client, config.foodsDatabaseId);
  const id = await repo.create(data);
  return NextResponse.json({ id }, { status: 201 });
}
