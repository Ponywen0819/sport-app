import { ApiHandler } from "@/lib/server/api/handler";
import {
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
    handler: ({ prisma, requestPayload: params }) => {
      const food = prisma.food.findUnique({
        where: {
          id: params.id,
        },
      });

      if (!food) {
        throw getRequestError(RequestErrorType.RESOURCE_NOT_FOUND);
      }

      return food;
    },
    routeParams: await params,
  });

  return handler.handle(request);
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
