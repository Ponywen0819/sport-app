import type { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { bodyIndexMapper, type BodyIndex, type CreateBodyIndexInput } from "../mappers/body-index-mapper";

export class BodyIndexesRepository {
  constructor(
    private client: Client,
    private databaseId: string
  ) {}

  async getLatest(): Promise<BodyIndex | null> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      sorts: [{ property: "Date", direction: "descending" }],
      page_size: 1,
    });

    const results = response.results as PageObjectResponse[];
    if (results.length === 0) return null;
    return bodyIndexMapper.fromPage(results[0]);
  }

  async getByDate(date: string): Promise<BodyIndex | null> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      filter: { property: "Date", date: { equals: date } },
      page_size: 1,
    });

    const results = response.results as PageObjectResponse[];
    if (results.length === 0) return null;
    return bodyIndexMapper.fromPage(results[0]);
  }

  async getHistory(limit: number = 30): Promise<BodyIndex[]> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      sorts: [{ property: "Date", direction: "descending" }],
      page_size: limit,
    });

    const results = response.results as PageObjectResponse[];
    return results.map((r) => bodyIndexMapper.fromPage(r));
  }

  async create(data: CreateBodyIndexInput): Promise<string> {
    const name = `${data.date} Body Check`;

    // Dynamically resolve title property name (may differ from "Name" depending on how the DB was created)
    const db = await this.client.databases.retrieve({ database_id: this.databaseId });
    const titleKey = Object.entries(db.properties).find(([, v]) => v.type === "title")?.[0] ?? "Name";

    const props = bodyIndexMapper.toProperties(data, name);
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
}
