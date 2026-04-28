import type {
  BodyIndex,
  CreateBodyIndexInput,
} from "@/lib/notion/mappers/body-index-mapper";
import { getDatabase, persistDatabase } from "@/lib/sqljs/database";
import { bodyIndexesLocalRepo } from "@/lib/sqljs/repositories/body-indexes";

export async function getLatestBodyIndex(): Promise<BodyIndex | null> {
  const db = await getDatabase();
  return bodyIndexesLocalRepo.getLatest(db);
}

export async function getBodyIndexByDate(
  date: string,
): Promise<BodyIndex | null> {
  const db = await getDatabase();
  return bodyIndexesLocalRepo.getByDate(db, date);
}

export async function getBodyIndexHistory(
  limit: number = 30,
): Promise<BodyIndex[]> {
  const db = await getDatabase();
  return bodyIndexesLocalRepo.getHistory(db, limit);
}

export async function addBodyIndex(
  data: CreateBodyIndexInput,
): Promise<{ id: string }> {
  const db = await getDatabase();
  const id = crypto.randomUUID();
  bodyIndexesLocalRepo.upsert(db, { id, ...data });
  await persistDatabase();
  return { id };
}
