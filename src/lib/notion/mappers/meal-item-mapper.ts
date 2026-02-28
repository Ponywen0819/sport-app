import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export type MealItem = {
  id: string;
  date: string;
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  foodId: string;
  foodName: string;
  intake: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type CreateMealItemInput = Omit<MealItem, "id">;

const getNumber = (prop: PageObjectResponse["properties"][string]): number => {
  if (prop?.type === "number") return prop.number ?? 0;
  return 0;
};

const getText = (prop: PageObjectResponse["properties"][string]): string => {
  if (prop?.type === "title") return prop.title[0]?.plain_text ?? "";
  if (prop?.type === "rich_text") return prop.rich_text[0]?.plain_text ?? "";
  return "";
};

const getDate = (prop: PageObjectResponse["properties"][string]): string => {
  if (prop?.type === "date") return prop.date?.start ?? "";
  return "";
};

const getSelect = (prop: PageObjectResponse["properties"][string]): string => {
  if (prop?.type === "select") return prop.select?.name ?? "";
  return "";
};

export const mealItemMapper = {
  fromPage: (page: PageObjectResponse): MealItem => {
    const p = page.properties;
    const mealType = getSelect(p.MealType) as MealItem["mealType"];
    return {
      id: page.id,
      date: getDate(p.Date),
      mealType: mealType || "Breakfast",
      foodId: getText(p.FoodId),
      foodName: getText(p.FoodName),
      intake: getNumber(p.Intake),
      calories: getNumber(p.Calories),
      protein: getNumber(p.Protein),
      fat: getNumber(p.Fat),
      carbs: getNumber(p.Carbs),
    };
  },

  toProperties: (data: CreateMealItemInput, name: string): Record<string, unknown> => ({
    Name: { title: [{ text: { content: name } }] },
    Date: { date: { start: data.date } },
    MealType: { select: { name: data.mealType } },
    FoodId: { rich_text: [{ text: { content: data.foodId } }] },
    FoodName: { rich_text: [{ text: { content: data.foodName } }] },
    Intake: { number: data.intake },
    Calories: { number: data.calories },
    Protein: { number: data.protein },
    Fat: { number: data.fat },
    Carbs: { number: data.carbs },
  }),
};
