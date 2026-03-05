import { NextRequest, NextResponse } from "next/server";
import { ExerciseRecordsRepository } from "@/lib/notion/repositories/exercise-records";
import { getExerciseConfig, notConfigured } from "../../../_config";

export type DailyWorkoutSummary = {
  date: string;
  exerciseCount: number;
  totalSets: number;
};

export async function GET(req: NextRequest) {
  const config = await getExerciseConfig();
  if (!config) return notConfigured();

  const from = req.nextUrl.searchParams.get("from") ?? "";
  const to = req.nextUrl.searchParams.get("to") ?? "";

  const repo = new ExerciseRecordsRepository(config.client, config.exerciseRecordsDatabaseId);
  const records = await repo.getByDateRange(from, to);

  const byDate = new Map<string, { exerciseCount: number; totalSets: number }>();
  for (const r of records) {
    const existing = byDate.get(r.date) ?? { exerciseCount: 0, totalSets: 0 };
    byDate.set(r.date, {
      exerciseCount: existing.exerciseCount + 1,
      totalSets: existing.totalSets + (r.sets || 1),
    });
  }

  const result: DailyWorkoutSummary[] = Array.from(byDate.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json(result);
}
