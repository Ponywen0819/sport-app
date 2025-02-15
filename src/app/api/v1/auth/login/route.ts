import {
  checkIsPayloadValidOrThrowRequestError,
  checkIsRequestError,
  RequestErrorType,
} from "@/utils/api";
import { LoginRequestSchema, PublicUserSchema } from "@/zod/auth-schema";
import { PrismaClient, Prisma, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt, { Jwt } from "jsonwebtoken";

export const POST = async (request: Request) => {
  const dbClient = new PrismaClient();

  const body = await request.json();
  try {
    const payload = checkIsPayloadValidOrThrowRequestError(
      LoginRequestSchema,
      body
    );

    const { email, password } = payload;

    const hashedPassword = await bcrypt.hash(password, 10);

    const userWhere: Prisma.UserWhereUniqueInput = {
      email: email,
    };

    const user = await dbClient.user.findUniqueOrThrow({
      where: userWhere,
    });

    if (!user) {
      return new Response(hashedPassword, { status: 403 });
      // return new Response("invalid email or password", { status: 403 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return new Response("invalid email or password", { status: 403 });
    }

    const jwtPayload = PublicUserSchema.parse({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const jwtOptions: jwt.SignOptions = {
      expiresIn: "1h",
    };

    const token = jwt.sign(jwtPayload, process.env.SECRET || "", jwtOptions);

    return new Response(JSON.stringify({ token }), { status: 200 });
  } catch (err) {
    if (checkIsRequestError(err)) {
      switch (err.error.type) {
        case RequestErrorType.INVALID_REQUEST_PAYLOAD:
          return new Response("invalid request payload", { status: 400 });
        case RequestErrorType.NOT_AUTHORIZED:
          return new Response("not ", { status: 401 });
      }
    }

    return new Response("Unknown Error", { status: 500 });
  }
};
