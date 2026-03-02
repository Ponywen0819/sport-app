import type { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { mealItemMapper, type MealItem, type CreateMealItemInput } from "../mappers/meal-item-mapper";

export class MealItemsRepository {
  constructor(
    private client: Client,
    private databaseId: string
  ) {}

  async getByDateAndMealType(date: string, mealType: MealItem["mealType"]): Promise<MealItem[]> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      filter: {
        and: [
          { property: "Date", date: { equals: date } },
          { property: "MealType", select: { equals: mealType } },
        ],
      },
    });

    return (response.results as PageObjectResponse[]).map(mealItemMapper.fromPage);
  }

  async getByDate(date: string): Promise<MealItem[]> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      filter: {
        property: "Date",
        date: { equals: date },
      },
    });

    return (response.results as PageObjectResponse[]).map(mealItemMapper.fromPage);
  }

  async getByDateRange(from: string, to: string): Promise<MealItem[]> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      filter: {
        and: [
          { property: "Date", date: { on_or_after: from } },
          { property: "Date", date: { on_or_before: to } },
        ],
      },
    });

    return (response.results as PageObjectResponse[]).map(mealItemMapper.fromPage);
  }

  async create(data: CreateMealItemInput): Promise<string> {
    const name = `${data.date} ${data.mealType} ${data.foodName}`;
    const db = await this.client.databases.retrieve({ database_id: this.databaseId });
    const titleKey = Object.entries(db.properties).find(([, v]) => v.type === "title")?.[0] ?? "Name";

    const props = mealItemMapper.toProperties(data, name);
    if (titleKey !== "Name") {
      props[titleKey] = props["Name"];
      delete props["Name"];
    }

    const response = await this.client.pages.create({
      parent: { database_id: this.databaseId },
      properties: props as Parameters<typeof this.client.pages.create>[0]["properties"],
    });
    return response.id;
  }

  async delete(id: string): Promise<void> {
    await this.client.pages.update({
      page_id: id,
      archived: true,
    });
  }
}
