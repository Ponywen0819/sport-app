import { z } from "zod";
import { AuthTokenPayloadSchema } from "@/zod/auth-schema";
import jwt from "jsonwebtoken";

export enum RequestErrorType {
  INVALID_REQUEST_PAYLOAD = "invalid_request_payload",
  NOT_AUTHORIZED = "not_authorized",
}

const RequestErrorSchema = z.object({
  error: z.object({
    type: z.nativeEnum(RequestErrorType),
    message: z.string(),
  }),
});

export const checkIsRequestBodyJsonOrThrowRequestError = async (
  request: Request
): Promise<any> => {
  try {
    if (request.headers.get("Content-Type") !== "application/json") {
      throw new Error("Invalid content type");
    }

    const json = await request.json();
    console.log(json);
    return json;
  } catch (error) {
    throw getRequestError(RequestErrorType.INVALID_REQUEST_PAYLOAD);
  }
};

export const checkIsPayloadValidOrThrowRequestError = <T>(
  schema: z.ZodType<T>,
  payload: any
): z.infer<typeof schema> => {
  try {
    const res = schema.parse(payload);
    return res;
  } catch (error) {
    throw getRequestError(RequestErrorType.INVALID_REQUEST_PAYLOAD);
  }
};

export const checkIsRequestAuthorizedOrThrowError = (
  request: Request
): z.infer<typeof AuthTokenPayloadSchema> => {
  try {
    const token = request.headers.get("Authorization");
    const tokenParts = checkTokenIsValid(token);
    if (!tokenParts) {
      throw new Error("Invalid token");
    }

    const [_, tokenValue] = tokenParts;

    const payload = jwt.verify(tokenValue, process.env.SECRET || "");
    return AuthTokenPayloadSchema.parse(payload);
  } catch (error) {
    throw getRequestError(RequestErrorType.NOT_AUTHORIZED);
  }
};

const checkTokenIsValid = (token: string | null): [string, string] | false => {
  if (!token) {
    return false;
  }

  const tokenParts = token.split(" ");
  if (tokenParts.length !== 2) {
    return false;
  }

  const [scheme, tokenValue] = tokenParts;
  if (scheme !== "Bearer") {
    return false;
  }
  return [scheme, tokenValue] as const;
};

export const checkIsRequestError = (
  err: unknown
): err is z.infer<typeof RequestErrorSchema> => {
  try {
    RequestErrorSchema.parse(err);
  } catch (error) {
    return false;
  }
  return true;
};

export const getRequestError = (type: RequestErrorType, message?: string) => {
  if (!message) message = getDefaultRequestErrorMessages(type);
  const requestError: z.infer<typeof RequestErrorSchema> = {
    error: {
      type,
      message,
    },
  };
  return requestError;
};

const getDefaultRequestErrorMessages = (type: RequestErrorType) => {
  switch (type) {
    case RequestErrorType.INVALID_REQUEST_PAYLOAD:
      return "Invalid request payload";
    case RequestErrorType.NOT_AUTHORIZED:
      return "Not authorized";
  }
};
