import { type NextRequest } from "next/server";
import {
  GetNutritionOverRequestSchema,
  GetNutritionOverResponseSchema,
} from "@/schema/nutrition-schema";
import { Food } from "@prisma/client";
import { z } from "zod";
import { ApiHandler } from "@/lib/server/api/handler";

type FoodWithIntake = Food & { intake: number };

export const GET = async (request: NextRequest) => {
  const handler = new ApiHandler({
    reqSchema: GetNutritionOverRequestSchema,
    resSchema: GetNutritionOverResponseSchema,
    handler: async ({ request, prisma, requestPayload, authPayload }) => {
      const { date } = requestPayload;
      const selectDate = new Date(date);
      const meals = await prisma.meal.findMany({
        select: {
          MealItem: {
            select: {
              intake: true,
              food: true,
            },
          },
        },
        where: {
          userId: authPayload.id,
          date: {
            gte: new Date(selectDate.setHours(0, 0, 0, 0)), // 今天 00:00:00
            lte: new Date(selectDate.setHours(23, 59, 59, 999)), // 今天 23:59:59.999
          },
        },
      });

      const foodList = meals.reduce((acc, meal) => {
        return acc.concat(
          meal.MealItem.map((item) => ({ ...item.food, intake: item.intake }))
        );
      }, [] as FoodWithIntake[]);

      const nutritionOverview = getNutritionOverviewByFoodList(foodList);

      return { nutrition: nutritionOverview };
    },
  });

  return handler.handle(request);
};

type OverviewPayload = z.infer<
  typeof GetNutritionOverResponseSchema
>["nutrition"];

const getNutritionOverviewByFoodList = (
  foodList: FoodWithIntake[]
): OverviewPayload => {
  return foodList.reduce(
    (acc, food) => {
      acc.calories += food.calories * food.intake;
      acc.protein += food.protein * food.intake;
      acc.carbs += food.carbs * food.intake;
      acc.fat += food.fat * food.intake;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 } as OverviewPayload
  );
};
