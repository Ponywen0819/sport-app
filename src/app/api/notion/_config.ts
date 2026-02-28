import { cookies } from "next/headers";
import { createNotionClient } from "@/lib/notion/client";
import { NextResponse } from "next/server";

export const notConfigured = () =>
  NextResponse.json({ error: "Notion 尚未設定，請前往設定頁面配置" }, { status: 401 });

export async function getExerciseConfig() {
  const cookieStore = await cookies();
  const token = cookieStore.get("notion_token")?.value;
  const exerciseRecordsDatabaseId = cookieStore.get("notion_exercise_records_db_id")?.value;
  if (!token || !exerciseRecordsDatabaseId) return null;
  return { client: createNotionClient(token), exerciseRecordsDatabaseId };
}

export async function getExercisesConfig() {
  const cookieStore = await cookies();
  const token = cookieStore.get("notion_token")?.value;
  const exercisesDatabaseId = cookieStore.get("notion_exercises_db_id")?.value;
  if (!token || !exercisesDatabaseId) return null;
  return { client: createNotionClient(token), exercisesDatabaseId };
}

export async function getNutritionConfig() {
  const cookieStore = await cookies();
  const token = cookieStore.get("notion_token")?.value;
  const foodsDatabaseId = cookieStore.get("notion_foods_db_id")?.value;
  const mealItemsDatabaseId = cookieStore.get("notion_meal_items_db_id")?.value;
  if (!token || !foodsDatabaseId || !mealItemsDatabaseId) return null;
  return { client: createNotionClient(token), foodsDatabaseId, mealItemsDatabaseId };
}
