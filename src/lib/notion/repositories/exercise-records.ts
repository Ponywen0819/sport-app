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

  async getPRByExercise(exerciseName: string): Promise<ExerciseRecord | null> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      filter: {
        property: "ExerciseName",
        rich_text: { contains: exerciseName },
      },
      sorts: [{ property: "Weight", direction: "descending" }],
      page_size: 1,
    });

    const results = response.results as PageObjectResponse[];
    if (results.length === 0) return null;
    return exerciseRecordMapper.fromPage(results[0]);
  }

  async getLatestByExercise(exerciseName: string): Promise<ExerciseRecord | null> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      filter: {
        property: "ExerciseName",
        rich_text: { contains: exerciseName },
      },
      sorts: [{ property: "Date", direction: "descending" }],
      page_size: 1,
    });

    const results = response.results as PageObjectResponse[];
    if (results.length === 0) return null;
    return exerciseRecordMapper.fromPage(results[0]);
  }

  async getProgressByExercise(exerciseName: string, weeks: number): Promise<ExerciseRecord[]> {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - weeks * 7);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const response = await this.client.databases.query({
      database_id: this.databaseId,
      filter: {
        and: [
          { property: "ExerciseName", rich_text: { contains: exerciseName } },
          { property: "Date", date: { on_or_after: fmt(from) } },
          { property: "Date", date: { on_or_before: fmt(to) } },
        ],
      },
      sorts: [{ property: "Date", direction: "ascending" }],
    });

    // Keep only the heaviest record per day
    const byDay = new Map<string, ExerciseRecord>();
    for (const page of response.results as PageObjectResponse[]) {
      const record = exerciseRecordMapper.fromPage(page);
      const existing = byDay.get(record.date);
      if (!existing || record.weightKg > existing.weightKg) {
        byDay.set(record.date, record);
      }
    }
    return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async create(data: CreateExerciseRecordInput): Promise<string> {
    const db = await this.client.databases.retrieve({ database_id: this.databaseId });
    const titleKey = Object.entries(db.properties).find(([, v]) => v.type === "title")?.[0] ?? "Name";

    const props = exerciseRecordMapper.toProperties(data) as Record<string, unknown>;
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
