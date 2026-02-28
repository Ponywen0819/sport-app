import { NextRequest, NextResponse } from "next/server";
import { ExerciseRecordsRepository } from "@/lib/notion/repositories/exercise-records";
import { getExerciseConfig, notConfigured } from "../../_config";

export async function GET(req: NextRequest) {
  const config = await getExerciseConfig();
  if (!config) return notConfigured();

  const start = req.nextUrl.searchParams.get("start");
  const end = req.nextUrl.searchParams.get("end");
  if (!start || !end) return NextResponse.json({ error: "Missing start or end" }, { status: 400 });

  const repo = new ExerciseRecordsRepository(config.client, config.exerciseRecordsDatabaseId);
  const records = await repo.getByDateRange(start, end);
  const dates = [...new Set(records.map((r) => r.date))];
  return NextResponse.json(dates);
}
