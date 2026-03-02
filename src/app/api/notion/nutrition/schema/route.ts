import { NextResponse } from "next/server";
import { getNutritionConfig, notConfigured } from "../../_config";
import {
  FOODS_DB_SCHEMA,
  MEAL_ITEMS_DB_SCHEMA,
  checkDatabaseSchema,
  migrateDatabaseSchema,
  type SchemaCheckResult,
} from "@/lib/notion/setup";

export type NutritionSchemaCheckResponse = {
  foods: SchemaCheckResult;
  mealItems: SchemaCheckResult;
  allValid: boolean;
};

/** GET — 檢查 Foods 和 MealItems DB 的 schema 是否符合預期 */
export async function GET() {
  const config = await getNutritionConfig();
  if (!config) return notConfigured();

  const [foods, mealItems] = await Promise.all([
    checkDatabaseSchema(config.client, config.foodsDatabaseId, FOODS_DB_SCHEMA),
    checkDatabaseSchema(config.client, config.mealItemsDatabaseId, MEAL_ITEMS_DB_SCHEMA),
  ]);

  const response: NutritionSchemaCheckResponse = {
    foods,
    mealItems,
    allValid: foods.valid && mealItems.valid,
  };

  return NextResponse.json(response);
}

/** POST — 補齊缺少的屬性（只新增，不刪除） */
export async function POST() {
  const config = await getNutritionConfig();
  if (!config) return notConfigured();

  // 先 check 一次取得缺少清單
  const [foods, mealItems] = await Promise.all([
    checkDatabaseSchema(config.client, config.foodsDatabaseId, FOODS_DB_SCHEMA),
    checkDatabaseSchema(config.client, config.mealItemsDatabaseId, MEAL_ITEMS_DB_SCHEMA),
  ]);

  await Promise.all([
    migrateDatabaseSchema(config.client, config.foodsDatabaseId, FOODS_DB_SCHEMA, foods.missingProperties),
    migrateDatabaseSchema(config.client, config.mealItemsDatabaseId, MEAL_ITEMS_DB_SCHEMA, mealItems.missingProperties),
  ]);

  return NextResponse.json({ success: true });
}
