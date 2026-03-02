import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { z } from "zod";
import { CreateFoodRequestSchema } from "@/schema/nutrition-schema";

export type Food = z.infer<typeof CreateFoodRequestSchema> & { id: string };

type FoodProperties = {
  name?: string;
  weight?: number;
  calories?: number;
  protein?: number;
  fat?: number;
  transFat?: number;
  saturatedFat?: number;
  monounsaturatedFat?: number;
  polyunsaturatedFat?: number;
  carbs?: number;
  sugar?: number;
  dietaryFiber?: number;
  sodium?: number;
  potassium?: number;
};

const getNumber = (prop: PageObjectResponse["properties"][string]): number => {
  if (prop?.type === "number") return prop.number ?? 0;
  return 0;
};

const getText = (prop: PageObjectResponse["properties"][string]): string => {
  if (prop?.type === "title") return prop.title[0]?.plain_text ?? "";
  if (prop?.type === "rich_text") return prop.rich_text[0]?.plain_text ?? "";
  return "";
};

export const foodMapper = {
  fromPage: (page: PageObjectResponse): Food => {
    const p = page.properties;
    const titleProp = Object.values(p).find((v) => v.type === "title");
    const name = titleProp?.type === "title" ? (titleProp.title[0]?.plain_text ?? "") : "";
    return {
      id: page.id,
      name,
      weight: getNumber(p.Weight),
      calories: getNumber(p.Calories),
      protein: getNumber(p.Protein),
      fat: getNumber(p.Fat),
      transFat: getNumber(p.TransFat),
      saturatedFat: getNumber(p.SaturatedFat),
      monounsaturatedFat: getNumber(p.MonounsaturatedFat),
      polyunsaturatedFat: getNumber(p.PolyunsaturatedFat),
      carbs: getNumber(p.Carbs),
      sugar: getNumber(p.Sugar),
      dietaryFiber: getNumber(p.DietaryFiber),
      sodium: getNumber(p.Sodium),
      potassium: getNumber(p.Potassium),
    };
  },

  toProperties: (data: FoodProperties): Record<string, unknown> => {
    const props: Record<string, unknown> = {};

    if (data.name !== undefined) {
      props.Name = { title: [{ text: { content: data.name } }] };
    }
    const numericFields: (keyof Omit<FoodProperties, "name">)[] = [
      "weight", "calories", "protein", "fat", "transFat", "saturatedFat",
      "monounsaturatedFat", "polyunsaturatedFat", "carbs", "sugar",
      "dietaryFiber", "sodium", "potassium",
    ];

    const fieldMap: Record<string, string> = {
      weight: "Weight", calories: "Calories", protein: "Protein", fat: "Fat",
      transFat: "TransFat", saturatedFat: "SaturatedFat",
      monounsaturatedFat: "MonounsaturatedFat", polyunsaturatedFat: "PolyunsaturatedFat",
      carbs: "Carbs", sugar: "Sugar", dietaryFiber: "DietaryFiber",
      sodium: "Sodium", potassium: "Potassium",
    };

    for (const field of numericFields) {
      if (data[field] !== undefined) {
        props[fieldMap[field]] = { number: data[field] };
      }
    }

    return props;
  },
};
