import { ApiHandler } from "@/lib/server/api/handler";
import {
  CreateFoodRequestSchema,
  CreateFoodResponseSchema,
  GetFoodRequestSchema,
  GetFoodResponseSchema,
} from "@/schema/nutrition-schema";
import {
  checkIsPayloadValidOrThrowRequestError,
  checkIsRequestAuthorizedOrThrowError,
  checkIsRequestBodyJsonOrThrowRequestError,
  checkIsRequestError,
  getRequestError,
  RequestErrorType,
} from "@/utils/api";
import { Food, PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

const defaultFoodRecord: z.infer<typeof CreateFoodRequestSchema> = {
  name: "",
  weight: 0,
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  transFat: 0,
  saturatedFat: 0,
  monounsaturatedFat: 0,
  polyunsaturatedFat: 0,
  sugar: 0,
  dietaryFiber: 0,
  sodium: 0,
  potassium: 0,
};

type FoodWithoutId = Omit<Food, "id">;

export const POST = async (request: NextRequest) => {
  try {
    checkIsRequestAuthorizedOrThrowError(request);
    const json = await checkIsRequestBodyJsonOrThrowRequestError(request);
    const validPayload = checkIsPayloadValidOrThrowRequestError(
      CreateFoodRequestSchema,
      json
    );

    const newFoodContent = {
      ...defaultFoodRecord,
      ...validPayload,
    } as FoodWithoutId;

    const dbClient = new PrismaClient();
    const newFood = await dbClient.food.create({
      data: newFoodContent,
    });

    const newFoodId = newFood.id;

    return new Response(JSON.stringify({ id: newFoodId }), {
      status: 201,
    });
  } catch (err) {
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

export const GET = async (request: NextRequest) => {
  const handler = new ApiHandler(
    GetFoodRequestSchema,
    GetFoodResponseSchema,
    true,
    ({ prisma, validatedPayload }) => {
      const food = prisma.food.findUnique({
        where: {
          id: validatedPayload.id,
        },
      });

      if (!food) {
        throw getRequestError(RequestErrorType.RESOURCE_NOT_FOUND);
      }

      return food;
    }
  );

  return handler.handle(request);
};
