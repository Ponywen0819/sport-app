import { z } from "zod";

// Notion page ID can be with or without dashes
export const NotionPageIdSchema = z
  .string()
  .min(1, "Page ID 不能為空")
  .transform((val) => val.replace(/-/g, ""))
  .pipe(z.string().length(32, "無效的 Notion Page ID 格式"));

export const NotionSetupRequestSchema = z.object({
  rootPageId: z.string().min(1),
});

export const NotionDatabaseIdsSchema = z.object({
  foodsDatabaseId: z.string(),
  mealItemsDatabaseId: z.string(),
  exerciseRecordsDatabaseId: z.string(),
  bodyIndexesDatabaseId: z.string(),
});

export type NotionDatabaseIds = z.infer<typeof NotionDatabaseIdsSchema>;
