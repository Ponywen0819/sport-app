import type { Client } from "@notionhq/client";
import type {
  CreatePageParameters,
  PageObjectResponse,
  UpdatePageParameters,
} from "@notionhq/client/build/src/api-endpoints";
import {
  exerciseMapper,
  type Exercise,
  type ExerciseInput,
} from "../mappers/exercise-mapper";

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

  async create(data: ExerciseInput): Promise<Exercise> {
    const response = await this.client.pages.create({
      parent: { database_id: this.databaseId },
      properties: exerciseMapper.toProperties(data) as CreatePageParameters["properties"],
    });
    return exerciseMapper.fromPage(response as PageObjectResponse);
  }

  async update(id: string, data: ExerciseInput): Promise<Exercise> {
    const response = await this.client.pages.update({
      page_id: id,
      properties: exerciseMapper.toProperties(data) as UpdatePageParameters["properties"],
    });
    return exerciseMapper.fromPage(response as PageObjectResponse);
  }

  async delete(id: string): Promise<void> {
    await this.client.pages.update({ page_id: id, archived: true });
  }
}
