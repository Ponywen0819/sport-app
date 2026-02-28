import type { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { foodMapper, type Food } from "../mappers/food-mapper";
import type { z } from "zod";
import type { CreateFoodRequestSchema } from "@/schema/nutrition-schema";

type CreateFoodInput = z.infer<typeof CreateFoodRequestSchema>;

export class FoodsRepository {
  constructor(
    private client: Client,
    private databaseId: string
  ) {}

  async search(name?: string): Promise<Food[]> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      filter: name
        ? { property: "Name", title: { contains: name } }
        : undefined,
      page_size: 50,
    });

    return (response.results as PageObjectResponse[]).map(foodMapper.fromPage);
  }

  async getById(id: string): Promise<Food | null> {
    try {
      const page = await this.client.pages.retrieve({ page_id: id });
      return foodMapper.fromPage(page as PageObjectResponse);
    } catch {
      return null;
    }
  }

  async create(data: CreateFoodInput): Promise<string> {
    const response = await this.client.pages.create({
      parent: { database_id: this.databaseId },
      properties: foodMapper.toProperties(data) as Parameters<typeof this.client.pages.create>[0]["properties"],
    });
    return response.id;
  }

  async update(id: string, data: Partial<CreateFoodInput>): Promise<void> {
    await this.client.pages.update({
      page_id: id,
      properties: foodMapper.toProperties(data) as Parameters<typeof this.client.pages.update>[0]["properties"],
    });
  }

  async delete(id: string): Promise<void> {
    await this.client.pages.update({
      page_id: id,
      archived: true,
    });
  }
}
