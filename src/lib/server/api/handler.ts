import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z, ZodType } from "zod";
import {
  checkIsPayloadValidOrThrowRequestError,
  checkIsRequestAuthorizedOrThrowError,
  checkIsRequestError,
  RequestError,
  RequestErrorType,
} from "@/utils/api";
import { AuthTokenPayloadSchema } from "@/schema/auth-schema";

type HandlerFunctionParams<T, REQUIRE_AUTH extends boolean = true> = {
  request: NextRequest;
  prisma: PrismaClient;
  validatedPayload: T;
  authPayload: REQUIRE_AUTH extends true
    ? z.infer<typeof AuthTokenPayloadSchema>
    : null;
};

type HandlerFunction<T, I, REQUIRE_AUTH extends boolean = true> = (
  params: HandlerFunctionParams<T, REQUIRE_AUTH>
) => Promise<I> | I;

export class ApiHandler<
  I = object,
  O = object,
  REQUIRE_AUTH extends boolean = true
> {
  private reqSchema: ZodType<I>;
  private resSchema: ZodType<O>;
  private requireAuth: REQUIRE_AUTH;
  private handler: HandlerFunction<I, O, REQUIRE_AUTH>;

  constructor(
    reqSchema: ZodType<I>,
    resSchema: ZodType<O>,
    requireAuth: REQUIRE_AUTH,
    handler: HandlerFunction<I, O, REQUIRE_AUTH>
  ) {
    this.reqSchema = reqSchema;
    this.resSchema = resSchema;
    this.requireAuth = requireAuth;
    this.handler = handler;
  }

  public async handle(request: NextRequest): Promise<NextResponse> {
    let prisma: PrismaClient | null = null;
    try {
      const authPayload = this.requireAuth
        ? checkIsRequestAuthorizedOrThrowError(request)
        : null;

      const validatedPayload = await this.getValidatedPayload(request);

      prisma = new PrismaClient();

      const handlerParams = {
        request,
        prisma,
        validatedPayload,
        authPayload,
      } as HandlerFunctionParams<z.infer<typeof this.reqSchema>, REQUIRE_AUTH>;

      const responsePayload = await this.handler(handlerParams);

      const validPayload = this.resSchema.parse(responsePayload);

      return NextResponse.json(validPayload);
    } catch (err) {
      return this.getApiErrorResponse(err);
    } finally {
      if (prisma) await prisma.$disconnect();
    }
  }

  private getApiErrorResponse = (err: unknown) => {
    const isRequestError = checkIsRequestError(err);
    if (!isRequestError) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
    const message = this.getDefaultRequestErrorMessages(err.error.type);
    const statusCode = this.getDefaultRequestErrorStatusCode(err.error.type);
    return NextResponse.json({ error: message }, { status: statusCode });
  };

  private getDefaultRequestErrorMessages = (type: RequestErrorType) => {
    switch (type) {
      case RequestErrorType.INVALID_REQUEST_PAYLOAD:
        return "Invalid request payload";
      case RequestErrorType.NOT_AUTHORIZED:
        return "Not authorized";
      case RequestErrorType.RESOURCE_NOT_FOUND:
        return "Resource not found";
      case RequestErrorType.UNKNOWN_ERROR:
        return "Unknown error";
      default:
        return "Unknown error";
    }
  };

  private getDefaultRequestErrorStatusCode(type: RequestErrorType) {
    switch (type) {
      case RequestErrorType.NOT_AUTHORIZED:
        return 403;
      case RequestErrorType.INVALID_REQUEST_PAYLOAD:
        return 400;
      default:
        return 500;
    }
  }

  private async getValidatedPayload(
    request: NextRequest
  ): Promise<z.infer<typeof this.reqSchema>> {
    if (request.method === "GET") {
      const searchParams = Object.fromEntries(
        request.nextUrl.searchParams.entries()
      );
      return checkIsPayloadValidOrThrowRequestError(
        this.reqSchema,
        searchParams
      );
    } else {
      const json = await request.json();
      return checkIsPayloadValidOrThrowRequestError(this.reqSchema, json);
    }
  }
}
