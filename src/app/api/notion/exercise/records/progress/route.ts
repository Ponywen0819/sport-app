import { NextRequest, NextResponse } from "next/server";
import { ExerciseRecordsRepository } from "@/lib/notion/repositories/exercise-records";
import { getExerciseConfig, notConfigured } from "../../../_config";

export async function GET(req: NextRequest) {
  const config = await getExerciseConfig();
  if (!config) return notConfigured();

  const name = req.nextUrl.searchParams.get("name") ?? "";
  const weeks = parseInt(req.nextUrl.searchParams.get("weeks") ?? "12", 10);

  const repo = new ExerciseRecordsRepository(config.client, config.exerciseRecordsDatabaseId);
  const records = await repo.getProgressByExercise(name, weeks);
  return NextResponse.json(records);
}
