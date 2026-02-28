import { Client } from "@notionhq/client";
import type { NotionDatabaseIds } from "@/schema/notion-schema";

type DatabaseSchema = {
  name: string;
  properties: Record<string, unknown>;
};

const FOODS_DB_SCHEMA: DatabaseSchema = {
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

const MEAL_ITEMS_DB_SCHEMA: DatabaseSchema = {
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

const EXERCISE_RECORDS_DB_SCHEMA: DatabaseSchema = {
  name: "🏋️ Exercise Records",
  properties: {
    Name: { title: {} },
    Date: { date: {} },
    Weight: { number: { format: "number" } },  // 統一 kg
    Reps: { number: { format: "number" } },
    Sets: { number: { format: "number" } },
    DropWeight: { number: { format: "number" } },  // drop set 降重，統一 kg
    DropReps: { number: { format: "number" } },
  },
};

const BODY_INDEXES_DB_SCHEMA: DatabaseSchema = {
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
