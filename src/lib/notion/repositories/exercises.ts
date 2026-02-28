import type { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { exerciseMapper, type Exercise } from "../mappers/exercise-mapper";

export class ExercisesRepository {
  constructor(
    private client: Client,
    private databaseId: string
  ) {}

  async search(name?: string): Promise<Exercise[]> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      filter: name
        ? { property: "Name", title: { contains: name } }
        : undefined,
      sorts: [{ property: "Name", direction: "ascending" }],
      page_size: 100,
    });

    return (response.results as PageObjectResponse[]).map(exerciseMapper.fromPage);
  }
}
