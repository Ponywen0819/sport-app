import { Client } from "@notionhq/client";
import type { NotionDatabaseIds } from "@/schema/notion-schema";

type PropertySpec = Record<string, unknown>;

type DatabaseSchema = {
  name: string;
  properties: PropertySpec;
};

export const FOODS_DB_SCHEMA: DatabaseSchema = {
  name: "🍎 Foods",
  properties: {
    Name: { title: {} },
    Weight: { number: { format: "number" } },
    Calories: { number: { format: "number" } },
    Protein: { number: { format: "number" } },
    Fat: { number: { format: "number" } },
    TransFat: { number: { format: "number" } },
    SaturatedFat: { number: { format: "number" } },
    MonounsaturatedFat: { number: { format: "number" } },
    PolyunsaturatedFat: { number: { format: "number" } },
    Carbs: { number: { format: "number" } },
    Sugar: { number: { format: "number" } },
    DietaryFiber: { number: { format: "number" } },
    Sodium: { number: { format: "number" } },
    Potassium: { number: { format: "number" } },
  },
};

export const MEAL_ITEMS_DB_SCHEMA: DatabaseSchema = {
  name: "🍽️ Meal Items",
  properties: {
    Name: { title: {} },
    Date: { date: {} },
    MealType: {
      select: {
        options: [
          { name: "Breakfast", color: "yellow" },
          { name: "Lunch", color: "green" },
          { name: "Dinner", color: "blue" },
          { name: "Snack", color: "orange" },
        ],
      },
    },
    Intake: { number: { format: "number" } },
    Calories: { number: { format: "number" } },
    Protein: { number: { format: "number" } },
    Fat: { number: { format: "number" } },
    Carbs: { number: { format: "number" } },
    FoodId: { rich_text: {} },
    FoodName: { rich_text: {} },
  },
};

export const EXERCISE_RECORDS_DB_SCHEMA: DatabaseSchema = {
  name: "🏋️ Exercise Records",
  properties: {
    Name: { title: {} },
    Date: { date: {} },
    ExerciseName: { rich_text: {} },
    Weight: { number: { format: "number" } },
    Reps: { number: { format: "number" } },
    Sets: { number: { format: "number" } },
    DropWeight: { number: { format: "number" } },
    DropReps: { number: { format: "number" } },
  },
};

export const BODY_INDEXES_DB_SCHEMA: DatabaseSchema = {
  name: "📊 Body Indexes",
  properties: {
    Name: { title: {} },
    Date: { date: {} },
    Weight: { number: { format: "number" } },
    Height: { number: { format: "number" } },
    BodyFatPercentage: { number: { format: "number" } },
    SkeletalMuscleWeight: { number: { format: "number" } },
    TotalWater: { number: { format: "number" } },
    ProteinWeight: { number: { format: "number" } },
    MineralWeight: { number: { format: "number" } },
    BodyFatWeight: { number: { format: "number" } },
    VisceralFatIndex: { number: { format: "number" } },
    BasalMetabolicRate: { number: { format: "number" } },
  },
};

export type SchemaCheckResult = {
  dbId: string;
  dbName: string;
  missingProperties: string[];
  valid: boolean;
};

/** 比對 Notion DB 的實際屬性 vs 預期 schema，回傳缺少的 property 名稱清單 */
/** Notion 不允許透過 update API 新增 title 類型屬性（每個 DB 只能有一個） */
const isTitleProperty = (spec: unknown): boolean =>
  typeof spec === "object" && spec !== null && "title" in spec;

export async function checkDatabaseSchema(
  client: Client,
  dbId: string,
  schema: DatabaseSchema
): Promise<SchemaCheckResult> {
  const db = await client.databases.retrieve({ database_id: dbId });
  const actualKeys = Object.keys(db.properties);
  const missingProperties = Object.keys(schema.properties).filter(
    (key) => !isTitleProperty(schema.properties[key]) && !actualKeys.includes(key)
  );
  return {
    dbId,
    dbName: schema.name,
    missingProperties,
    valid: missingProperties.length === 0,
  };
}

/** 將缺少的屬性補齊到現有 Notion DB（只新增，不刪除，不含 title 欄） */
export async function migrateDatabaseSchema(
  client: Client,
  dbId: string,
  schema: DatabaseSchema,
  missingProperties: string[]
): Promise<void> {
  const addable = missingProperties.filter((key) => !isTitleProperty(schema.properties[key]));
  if (addable.length === 0) return;
  const propertiesToAdd = Object.fromEntries(
    addable.map((key) => [key, schema.properties[key]])
  );
  await client.databases.update({
    database_id: dbId,
    properties: propertiesToAdd as Parameters<typeof client.databases.update>[0]["properties"],
  });
}

async function createDatabase(
  client: Client,
  rootPageId: string,
  schema: DatabaseSchema
): Promise<string> {
  const response = await client.databases.create({
    parent: { type: "page_id", page_id: rootPageId },
    title: [{ type: "text", text: { content: schema.name } }],
    properties: schema.properties as Parameters<typeof client.databases.create>[0]["properties"],
  });
  return response.id;
}

export async function setupNotionDatabases(
  client: Client,
  rootPageId: string
): Promise<NotionDatabaseIds> {
  const [
    foodsDatabaseId,
    mealItemsDatabaseId,
    exerciseRecordsDatabaseId,
    bodyIndexesDatabaseId,
  ] = await Promise.all([
    createDatabase(client, rootPageId, FOODS_DB_SCHEMA),
    createDatabase(client, rootPageId, MEAL_ITEMS_DB_SCHEMA),
    createDatabase(client, rootPageId, EXERCISE_RECORDS_DB_SCHEMA),
    createDatabase(client, rootPageId, BODY_INDEXES_DB_SCHEMA),
  ]);

  return {
    foodsDatabaseId,
    mealItemsDatabaseId,
    exerciseRecordsDatabaseId,
    bodyIndexesDatabaseId,
  };
}

export async function verifyRootPageAccess(
  client: Client,
  rootPageId: string
): Promise<boolean> {
  try {
    await client.pages.retrieve({ page_id: rootPageId });
    return true;
  } catch {
    return false;
  }
}
