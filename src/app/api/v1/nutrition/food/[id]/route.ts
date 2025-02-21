import { ApiHandler, InputSourceEnum } from "@/lib/server/api/handler";
import {
  DeleteFoodRequestSchema,
  DeleteFoodResponseSchema,
  GetFoodRequestSchema,
  GetFoodResponseSchema,
  UpdateFoodRequestSchema,
  UpdateFoodResponseSchema,
} from "@/schema/nutrition-schema";
import { getRequestError, RequestErrorType } from "@/utils/api";
import { NextRequest } from "next/server";

type RouteParams = Promise<{
  id: string;
}>;

export const GET = async (
  request: NextRequest,
  { params }: { params: RouteParams }
) => {
  const handler = new ApiHandler({
    reqSchema: GetFoodRequestSchema,
    resSchema: GetFoodResponseSchema,
    handler: async ({ prisma, requestPayload, routeParams }) => {
      const food = await prisma.food.findUnique({
        where: {
          id: routeParams.id,
        },
      });

      if (!food) {
        throw getRequestError(RequestErrorType.RESOURCE_NOT_FOUND);
      }

      return food;
    },
    routeParams: await params,
  });

  return await handler.handle(request);
};

export const PUT = async (
  request: NextRequest,
  { params }: { params: RouteParams }
) => {
  const handler = new ApiHandler({
    reqSchema: UpdateFoodRequestSchema,
    resSchema: UpdateFoodResponseSchema,
    handler: ({ prisma, requestPayload, routeParams }) => {
      const food = prisma.food.update({
        where: {
          id: routeParams.id,
        },
        data: requestPayload,
      });

      return food;
    },
    routeParams: await params,
  });

  return handler.handle(request);
};

export const DELETE = async (
  request: NextRequest,
  { params }: { params: RouteParams }
) => {
  const handler = new ApiHandler({
    reqSchema: DeleteFoodRequestSchema,
    resSchema: DeleteFoodResponseSchema,
    handler: async ({ prisma, routeParams }) => {
      const food = await prisma.food.findUnique({
        where: {
          id: routeParams.id,
        },
      });

      if (!food) {
        throw getRequestError(RequestErrorType.RESOURCE_NOT_FOUND);
      }

      await prisma.food.delete({
        where: {
          id: routeParams.id,
        },
      });

      return { id: routeParams.id };
    },
    routeParams: await params,
    inputSource: InputSourceEnum.None,
  });

  return handler.handle(request);
};
