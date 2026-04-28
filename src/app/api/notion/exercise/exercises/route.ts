import { NextRequest, NextResponse } from "next/server";
import { ExercisesRepository } from "@/lib/notion/repositories/exercises";
import type { ExerciseInput } from "@/lib/notion/mappers/exercise-mapper";
import { getExercisesConfig, notConfigured } from "../../_config";

export async function GET(req: NextRequest) {
  const config = await getExercisesConfig();
  if (!config) return notConfigured();

  const name = req.nextUrl.searchParams.get("name") ?? undefined;
  const repo = new ExercisesRepository(config.client, config.exercisesDatabaseId);
  const exercises = await repo.search(name);
  return NextResponse.json(exercises);
}

export async function POST(req: NextRequest) {
  const config = await getExercisesConfig();
  if (!config) return notConfigured();

  const body = (await req.json()) as Partial<ExerciseInput>;
  const machineName = body.machineName?.trim();
  if (!machineName) {
    return NextResponse.json({ error: "機器名稱不可為空" }, { status: 400 });
  }

  const repo = new ExercisesRepository(config.client, config.exercisesDatabaseId);
  const exercise = await repo.create({
    brand: body.brand?.trim() ?? "",
    machineName,
    equipment: body.equipment ?? "",
    muscleGroups: body.muscleGroups ?? [],
  });
  return NextResponse.json(exercise, { status: 201 });
}
