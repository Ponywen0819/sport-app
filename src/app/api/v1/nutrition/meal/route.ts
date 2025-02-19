import {
  GetMealFoodItemSchema,
  GetMealRequestSchema,
  GetMealResponseSchema,
} from "@/schema/nutrition-schema";
import {
  checkIsPayloadValidOrThrowRequestError,
  checkIsRequestAuthorizedOrThrowError,
  checkIsRequestError,
  RequestErrorType,
} from "@/utils/api";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

export const GET = async (request: NextRequest) => {
  try {
    const authTokenPayload = checkIsRequestAuthorizedOrThrowError(request);
    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries()
    );
    const validPayload = checkIsPayloadValidOrThrowRequestError(
      GetMealRequestSchema,
      searchParams
    );

    const { date, mealType } = validPayload;

    const dbClient = new PrismaClient();
    const mealTypeRecord = await dbClient.mealType.findUnique({
      where: {
        name: "dinner",
      },
    });

    if (!mealTypeRecord) {
      return new Response("Invalid Meal Type", { status: 400 });
    }

    const meal = await dbClient.meal.findUnique({
      include: {
        foods: true,
      },
      where: {
        date_userId_mealTypeId: {
          userId: authTokenPayload.id,
          date: new Date(date),
          mealTypeId: mealTypeRecord.id,
        },
      },
    });

    if (!meal) {
      return new Response("Meal Not Found", { status: 404 });
    }

    const items = meal.foods.map((food) =>
      GetMealFoodItemSchema.parse({
        name: food.name,
        calories: food.calories,
        carbs: food.carbs,
        fat: food.fat,
        protein: food.protein,
      })
    );
    const response = GetMealResponseSchema.parse({ date, mealType, items });
    const jsonString = JSON.stringify(response);
    return new Response(jsonString, { status: 200 });
  } catch (err) {
    console.error(err);
    if (checkIsRequestError(err)) {
      switch (err.error.type) {
        case RequestErrorType.NOT_AUTHORIZED:
          return new Response("Not Authorized", { status: 403 });
        case RequestErrorType.INVALID_REQUEST_PAYLOAD:
          return new Response("Invalid Request Payload", { status: 400 });
        default:
          return new Response("Unknown Error", { status: 500 });
      }
    }
    return new Response("Unknown Error", { status: 500 });
  }
};
