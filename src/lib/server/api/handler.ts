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

export enum InputSourceEnum {
  JSON = "json",
  QUERY = "query",
  None = "none",
}

type HandlerFunctionAuthPayload<REQUIRE_AUTH extends boolean> =
  REQUIRE_AUTH extends true ? z.infer<typeof AuthTokenPayloadSchema> : null;

type HandlerFunctionParams<
  I extends object,
  P extends object,
  REQUIRE_AUTH extends boolean = true
> = {
  request: NextRequest;
  prisma: PrismaClient;
  requestPayload: I;
  authPayload: HandlerFunctionAuthPayload<REQUIRE_AUTH>;
  routeParams: P;
};

export type HandlerFunction<
  I extends object,
  O extends object,
  P extends object,
  REQUIRE_AUTH extends boolean = true
> = (params: HandlerFunctionParams<I, P, REQUIRE_AUTH>) => Promise<O> | O;

type ConstructorParams<
  I extends object,
  O extends object,
  P extends object,
  REQUIRE_AUTH extends boolean = true
> = {
  reqSchema: ZodType<I>;
  resSchema: ZodType<O>;
  handler: HandlerFunction<I, O, P, REQUIRE_AUTH>;
  requireAuth?: REQUIRE_AUTH;
  inputSource?: InputSourceEnum;
  routeParams?: P;
};

export class ApiHandler<
  I extends object = {},
  O extends object = {},
  P extends object = {},
  REQUIRE_AUTH extends boolean = true
> {
  private reqSchema: ZodType<I>;
  private resSchema: ZodType<O>;
  private requireAuth: REQUIRE_AUTH;
  private handler: HandlerFunction<I, O, P, REQUIRE_AUTH>;
  private inputSource: InputSourceEnum = InputSourceEnum.JSON;
  private routeParams: P;

  constructor(prams: ConstructorParams<I, O, P, REQUIRE_AUTH>) {
    const {
      reqSchema,
      resSchema,
      handler,
      requireAuth = true as REQUIRE_AUTH,
      inputSource = InputSourceEnum.JSON,
      routeParams = {} as P,
    } = prams;
    this.reqSchema = reqSchema;
    this.resSchema = resSchema;
    this.requireAuth = requireAuth;
    this.handler = handler;
    this.inputSource = inputSource;
    this.routeParams = routeParams;
  }

  public async handle(request: NextRequest): Promise<NextResponse> {
    let prisma: PrismaClient | null = null;
    try {
      const authPayload = (
        this.requireAuth ? checkIsRequestAuthorizedOrThrowError(request) : null
      ) as HandlerFunctionAuthPayload<REQUIRE_AUTH>;

      const validatedPayload = await this.getValidatedPayload(
        request,
        this.inputSource
      );

      prisma = new PrismaClient();

      const handlerParams = {
        request,
        prisma,
        requestPayload: validatedPayload,
        authPayload: authPayload,
        routeParams: this.routeParams,
      } as HandlerFunctionParams<I, P, REQUIRE_AUTH>;

      const responsePayload = await this.handler(handlerParams);

      const validResPayload = this.resSchema.parse(responsePayload);

      return NextResponse.json(validResPayload);
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
      case RequestErrorType.RESOURCE_NOT_FOUND:
        return 404;
      default:
        return 500;
    }
  }

  private async getValidatedPayload(
    request: NextRequest,
    source: InputSourceEnum = InputSourceEnum.JSON
  ): Promise<z.infer<typeof this.reqSchema>> {
    if (source === InputSourceEnum.QUERY || request.method === "GET") {
      const searchParams = Object.fromEntries(
        request.nextUrl.searchParams.entries()
      );
      return checkIsPayloadValidOrThrowRequestError(
        this.reqSchema,
        searchParams
      );
    } else if (source === InputSourceEnum.None) {
      return {} as z.infer<typeof this.reqSchema>;
    } else {
      const json = await request.json();
      return checkIsPayloadValidOrThrowRequestError(this.reqSchema, json);
    }
  }
}
