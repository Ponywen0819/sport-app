import { type NextRequest } from "next/server";
import {
  checkIsPayloadValidOrThrowRequestError,
  checkIsRequestAuthorizedOrThrowError,
  checkIsRequestBodyJsonOrThrowRequestError,
  checkIsRequestError,
  RequestErrorType,
} from "@/utils/api";
import {
  GetNutritionOverRequestSchema,
  GetNutritionOverResponseSchema,
} from "@/schema/nutrition-schema";
import { PrismaClient, Food } from "@prisma/client";
import { z } from "zod";

export const GET = async (request: NextRequest) => {
  try {
    const authTokenPayload = checkIsRequestAuthorizedOrThrowError(request);
    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries()
    );
    const validPayload = checkIsPayloadValidOrThrowRequestError(
      GetNutritionOverRequestSchema,
      searchParams
    );

    const { date } = validPayload;
    const dbClient = new PrismaClient();

    const selectDate = new Date(date);
    const meals = await dbClient.meal.findMany({
      include: {
        foods: true,
      },
      where: {
        userId: authTokenPayload.id,
        date: {
          gte: new Date(selectDate.setHours(0, 0, 0, 0)), // 今天 00:00:00
          lte: new Date(selectDate.setHours(23, 59, 59, 999)), // 今天 23:59:59.999
        },
      },
    });

    const foodList = meals.reduce((acc, meal) => {
      return acc.concat(meal.foods);
    }, [] as Food[]);

    const nutritionOverview = getNutritionOverviewByFoodList(foodList);

    const responsePayload = GetNutritionOverResponseSchema.parse({
      nutrition: nutritionOverview,
    });

    return new Response(JSON.stringify(responsePayload), { status: 200 });
  } catch (err) {
    if (checkIsRequestError(err)) {
      switch (err.error.type) {
        case RequestErrorType.NOT_AUTHORIZED:
          return new Response("Not Authorized", { status: 403 });
        case RequestErrorType.INVALID_REQUEST_PAYLOAD:
          return new Response("Invalid Request Payload", { status: 400 });
      }
    }
    return new Response("Unknown Error", { status: 500 });
  }
};
type OverviewPayload = z.infer<
  typeof GetNutritionOverResponseSchema
>["nutrition"];

const getNutritionOverviewByFoodList = (foodList: Food[]): OverviewPayload => {
  return foodList.reduce(
    (acc, food) => {
      acc.calories += food.calories;
      acc.protein += food.protein;
      acc.carbs += food.carbs;
      acc.fat += food.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 } as OverviewPayload
  );
};
