import { NextRequest, NextResponse } from "next/server";
import { ExercisesRepository } from "@/lib/notion/repositories/exercises";
import type { ExerciseInput } from "@/lib/notion/mappers/exercise-mapper";
import { getExercisesConfig, notConfigured } from "../../../_config";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const config = await getExercisesConfig();
  if (!config) return notConfigured();

  const { id } = await params;
  const body = (await req.json()) as Partial<ExerciseInput>;
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "名稱不可為空" }, { status: 400 });
  }

  const repo = new ExercisesRepository(config.client, config.exercisesDatabaseId);
  const exercise = await repo.update(id, {
    name,
    equipment: body.equipment ?? "",
    muscleGroups: body.muscleGroups ?? [],
  });
  return NextResponse.json(exercise);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const config = await getExercisesConfig();
  if (!config) return notConfigured();

  const { id } = await params;
  const repo = new ExercisesRepository(config.client, config.exercisesDatabaseId);
  await repo.delete(id);
  return new NextResponse(null, { status: 204 });
}
