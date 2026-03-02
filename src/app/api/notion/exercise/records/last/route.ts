import { NextRequest, NextResponse } from "next/server";
import { ExerciseRecordsRepository } from "@/lib/notion/repositories/exercise-records";
import { getExerciseConfig, notConfigured } from "../../../_config";

export async function GET(req: NextRequest) {
  const config = await getExerciseConfig();
  if (!config) return notConfigured();

  const exerciseName = req.nextUrl.searchParams.get("name");
  if (!exerciseName) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const repo = new ExerciseRecordsRepository(config.client, config.exerciseRecordsDatabaseId);
  const record = await repo.getLatestByExercise(exerciseName);
  return NextResponse.json(record);
}
