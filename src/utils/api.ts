import exp from "constants";
import { z } from "zod";

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

export const checkIsPayloadValidOrThrowRequestError = <T>(
  schema: z.ZodType<T>,
  payload: any
): z.infer<typeof schema> => {
  try {
    const res = schema.parse(payload);
    return res;
  } catch (error) {
    const requestError: z.infer<typeof RequestErrorSchema> = {
      error: {
        type: RequestErrorType.INVALID_REQUEST_PAYLOAD,
        message: "Invalid request payload",
      },
    };
    throw requestError;
  }
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

export const throwRequestError = (type: RequestErrorType, message: string) => {
  const requestError: z.infer<typeof RequestErrorSchema> = {
    error: {
      type,
      message,
    },
  };
  throw requestError;
};
