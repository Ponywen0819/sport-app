import { CalendarDate } from "@/components/date-selector";
import { GetNutritionOverResponseSchema } from "@/schema/nutrition-schema";
import { z } from "zod";

export const getNutritionOverview = async (
  date: CalendarDate,
  token: string
): Promise<z.infer<typeof GetNutritionOverResponseSchema>> => {
  const yearString = date.year.toString().padStart(4, "0");
  const monthString = (date.month + 1).toString().padStart(2, "0");
  const dayString = date.day.toString().padStart(2, "0");
  const dateString = `${yearString}-${monthString}-${dayString}`;
  const fetchUrl = `/api/v1/nutrition?date=${dateString}`;
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${token}`);

  const response = await fetch(fetchUrl, {
    headers,
  });
  try {
    const data = await response.json();

    return GetNutritionOverResponseSchema.parse(data);
  } catch (err) {
    throw new Error("Failed to fetch nutrition data");
  }
};
