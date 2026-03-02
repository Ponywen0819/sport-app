import { NextRequest, NextResponse } from "next/server";
import { createNotionClient } from "@/lib/notion/client";

type ValidationResult = {
  token: boolean;
  foodsDb: boolean;
  mealItemsDb: boolean;
  exerciseRecordsDb: boolean;
  exercisesDb: boolean;
  bodyIndexesDb: boolean;
};

async function testDatabase(client: ReturnType<typeof createNotionClient>, dbId: string): Promise<boolean> {
  if (!dbId) return false;
  try {
    await client.databases.retrieve({ database_id: dbId });
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, foodsDbId, mealItemsDbId, exerciseRecordsDbId, exercisesDbId, bodyIndexesDbId } = body;

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  let tokenValid = false;
  try {
    const client = createNotionClient(token);
    await client.users.me({});
    tokenValid = true;

    const [foodsDb, mealItemsDb, exerciseRecordsDb, exercisesDb, bodyIndexesDb] = await Promise.all([
      testDatabase(client, foodsDbId),
      testDatabase(client, mealItemsDbId),
      testDatabase(client, exerciseRecordsDbId),
      testDatabase(client, exercisesDbId),
      testDatabase(client, bodyIndexesDbId),
    ]);

    const result: ValidationResult = {
      token: tokenValid,
      foodsDb,
      mealItemsDb,
      exerciseRecordsDb,
      exercisesDb,
      bodyIndexesDb,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({
      token: false,
      foodsDb: false,
      mealItemsDb: false,
      exerciseRecordsDb: false,
      exercisesDb: false,
      bodyIndexesDb: false,
    } satisfies ValidationResult);
  }
}
