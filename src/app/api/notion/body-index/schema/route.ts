import { NextResponse } from "next/server";
import { getBodyIndexConfig, notConfigured } from "../../_config";
import {
  BODY_INDEXES_DB_SCHEMA,
  checkDatabaseSchema,
  migrateDatabaseSchema,
  type SchemaCheckResult,
} from "@/lib/notion/setup";

export type BodyIndexSchemaCheckResponse = {
  bodyIndexes: SchemaCheckResult;
  allValid: boolean;
};

export async function GET() {
  const config = await getBodyIndexConfig();
  if (!config) return notConfigured();

  const bodyIndexes = await checkDatabaseSchema(
    config.client,
    config.bodyIndexesDatabaseId,
    BODY_INDEXES_DB_SCHEMA
  );

  const response: BodyIndexSchemaCheckResponse = {
    bodyIndexes,
    allValid: bodyIndexes.valid,
  };

  return NextResponse.json(response);
}

export async function POST() {
  const config = await getBodyIndexConfig();
  if (!config) return notConfigured();

  const bodyIndexes = await checkDatabaseSchema(
    config.client,
    config.bodyIndexesDatabaseId,
    BODY_INDEXES_DB_SCHEMA
  );

  await migrateDatabaseSchema(
    config.client,
    config.bodyIndexesDatabaseId,
    BODY_INDEXES_DB_SCHEMA,
    bodyIndexes.missingProperties
  );

  return NextResponse.json({ success: true });
}
