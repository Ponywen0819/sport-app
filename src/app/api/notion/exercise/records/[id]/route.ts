import { NextRequest, NextResponse } from "next/server";
import { ExerciseRecordsRepository } from "@/lib/notion/repositories/exercise-records";
import { getExerciseConfig, notConfigured } from "../../../_config";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const config = await getExerciseConfig();
  if (!config) return notConfigured();

  const { id } = await params;
  const repo = new ExerciseRecordsRepository(config.client, config.exerciseRecordsDatabaseId);
  await repo.delete(id);
  return new NextResponse(null, { status: 204 });
}
