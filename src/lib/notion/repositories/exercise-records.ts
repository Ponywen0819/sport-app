import type { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { exerciseRecordMapper, type ExerciseRecord, type CreateExerciseRecordInput } from "../mappers/exercise-record-mapper";

export class ExerciseRecordsRepository {
  constructor(
    private client: Client,
    private databaseId: string
  ) {}

  async getByDate(date: string): Promise<ExerciseRecord[]> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      filter: {
        property: "Date",
        date: { equals: date },
      },
      sorts: [{ property: "Date", direction: "descending" }],
    });

    return (response.results as PageObjectResponse[]).map(exerciseRecordMapper.fromPage);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<ExerciseRecord[]> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      filter: {
        and: [
          { property: "Date", date: { on_or_after: startDate } },
          { property: "Date", date: { on_or_before: endDate } },
        ],
      },
      sorts: [{ property: "Date", direction: "descending" }],
    });

    return (response.results as PageObjectResponse[]).map(exerciseRecordMapper.fromPage);
  }

  async create(data: CreateExerciseRecordInput): Promise<string> {
    const response = await this.client.pages.create({
      parent: { database_id: this.databaseId },
      properties: exerciseRecordMapper.toProperties(data) as Parameters<typeof this.client.pages.create>[0]["properties"],
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
