import type { MealItem } from "@/lib/notion/mappers/meal-item-mapper";
import type { Food } from "@/lib/notion/mappers/food-mapper";

type NutritionOverview = { calories: number; protein: number; fat: number; carbs: number };
export type { DailySummary } from "@/app/api/notion/nutrition/weekly-summary/route";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function getNutritionOverview(date: string): Promise<NutritionOverview> {
  return apiFetch(`/api/notion/nutrition/overview?date=${date}`);
}

export function getMealItems(date: string, mealType: MealItem["mealType"]): Promise<MealItem[]> {
  return apiFetch(`/api/notion/nutrition/meals?date=${date}&mealType=${mealType}`);
}

export function addMealItem(data: Omit<MealItem, "id">): Promise<{ id: string }> {
  return apiFetch("/api/notion/nutrition/meals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function removeMealItem(id: string): Promise<void> {
  return apiFetch(`/api/notion/nutrition/meals/${id}`, { method: "DELETE" });
}

export function updateMealItem(id: string, data: { intake: number; calories: number; protein: number; fat: number; carbs: number }): Promise<void> {
  return apiFetch(`/api/notion/nutrition/meals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function searchFoods(name?: string): Promise<Food[]> {
  const url = name
    ? `/api/notion/nutrition/foods?name=${encodeURIComponent(name)}`
    : "/api/notion/nutrition/foods";
  return apiFetch(url);
}

export function addFood(data: Omit<Food, "id">): Promise<{ id: string }> {
  return apiFetch("/api/notion/nutrition/foods", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function getWeeklySummary(from: string, to: string): Promise<import("@/app/api/notion/nutrition/weekly-summary/route").DailySummary[]> {
  return apiFetch(`/api/notion/nutrition/weekly-summary?from=${from}&to=${to}`);
}
