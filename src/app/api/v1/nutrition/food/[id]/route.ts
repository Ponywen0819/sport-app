import { ApiHandler } from "@/lib/server/api/handler";
import {
  GetFoodRequestSchema,
  GetFoodResponseSchema,
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
    },
    async () => {
      return {
        id: (await params).id,
      };
    }
  );

  return handler.handle(request);
};
