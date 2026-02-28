import { NextRequest, NextResponse } from "next/server";
import { ExerciseRecordsRepository } from "@/lib/notion/repositories/exercise-records";
import { getExerciseConfig, notConfigured } from "../../_config";

export async function GET(req: NextRequest) {
  const config = await getExerciseConfig();
  if (!config) return notConfigured();

  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });

  const repo = new ExerciseRecordsRepository(config.client, config.exerciseRecordsDatabaseId);
  const records = await repo.getByDate(date);
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const config = await getExerciseConfig();
  if (!config) return notConfigured();

  const data = await req.json();
  const repo = new ExerciseRecordsRepository(config.client, config.exerciseRecordsDatabaseId);
  const id = await repo.create(data);
  return NextResponse.json({ id }, { status: 201 });
}
