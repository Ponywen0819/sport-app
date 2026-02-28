import { NextRequest, NextResponse } from "next/server";
import { ExercisesRepository } from "@/lib/notion/repositories/exercises";
import { getExercisesConfig, notConfigured } from "../../_config";

export async function GET(req: NextRequest) {
  const config = await getExercisesConfig();
  if (!config) return notConfigured();

  const name = req.nextUrl.searchParams.get("name") ?? undefined;
  const repo = new ExercisesRepository(config.client, config.exercisesDatabaseId);
  const exercises = await repo.search(name);
  return NextResponse.json(exercises);
}
