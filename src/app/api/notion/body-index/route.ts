import { NextRequest, NextResponse } from "next/server";
import { BodyIndexesRepository } from "@/lib/notion/repositories/body-indexes";
import { getBodyIndexConfig, notConfigured } from "../_config";

export async function GET(req: NextRequest) {
  const config = await getBodyIndexConfig();
  if (!config) return notConfigured();

  const repo = new BodyIndexesRepository(config.client, config.bodyIndexesDatabaseId);
  const date = req.nextUrl.searchParams.get("date");
  const history = req.nextUrl.searchParams.get("history");

  if (history === "true") {
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "30", 10);
    const records = await repo.getHistory(limit);
    return NextResponse.json(records);
  }

  if (date) {
    const record = await repo.getByDate(date);
    return NextResponse.json(record);
  }

  const latest = await repo.getLatest();
  return NextResponse.json(latest);
}

export async function POST(req: NextRequest) {
  const config = await getBodyIndexConfig();
  if (!config) return notConfigured();

  const data = await req.json();
  const repo = new BodyIndexesRepository(config.client, config.bodyIndexesDatabaseId);
  const id = await repo.create(data);
  return NextResponse.json({ id }, { status: 201 });
}
