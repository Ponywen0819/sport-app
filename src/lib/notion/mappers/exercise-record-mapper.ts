import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

// Notion 內部統一存 kg，前端負責轉換顯示
export type WeightUnit = "kg" | "磅";

export const lbsToKg = (lbs: number): number =>
  Math.round(lbs * 0.453592 * 100) / 100;

export const kgToLbs = (kg: number): number =>
  Math.round(kg * 2.20462 * 10) / 10;

export const convertToDisplay = (kg: number, unit: WeightUnit): number =>
  unit === "磅" ? kgToLbs(kg) : kg;

export const convertToKg = (value: number, unit: WeightUnit): number =>
  unit === "磅" ? lbsToKg(value) : value;

export type ExerciseRecord = {
  id: string;
  exerciseName: string;   // ExerciseName rich_text（顯示用）
  exerciseId: string | null; // Exercise relation → Exercises DB
  date: string;
  // 以下重量皆以 kg 儲存
  weightKg: number;
  reps: number;
  sets: number;
  // Drop set（有值代表此筆是 drop set，sets 固定為 1）
  dropWeightKg: number | null;
  dropReps: number | null;
};

export type CreateExerciseRecordInput = {
  exerciseName: string;
  exerciseId: string;
  date: string;
  weightKg: number;
  reps: number;
  sets: number;
  dropWeightKg: number | null;
  dropReps: number | null;
};

const getNumber = (prop: PageObjectResponse["properties"][string]): number | null => {
  if (prop?.type === "number") return prop.number;
  return null;
};

const getText = (prop: PageObjectResponse["properties"][string]): string => {
  if (prop?.type === "title") return prop.title[0]?.plain_text ?? "";
  if (prop?.type === "rich_text") return prop.rich_text[0]?.plain_text ?? "";
  return "";
};

const getRelationId = (prop: PageObjectResponse["properties"][string]): string | null => {
  if (prop?.type === "relation") return prop.relation[0]?.id ?? null;
  return null;
};

const getDate = (prop: PageObjectResponse["properties"][string]): string => {
  if (prop?.type === "date") return prop.date?.start ?? "";
  return "";
};

export const exerciseRecordMapper = {
  fromPage: (page: PageObjectResponse): ExerciseRecord => {
    const p = page.properties;
    return {
      id: page.id,
      exerciseName: getText(p.ExerciseName),
      exerciseId: getRelationId(p.Exercise),
      date: getDate(p.Date),
      weightKg: getNumber(p.Weight) ?? 0,
      reps: getNumber(p.Reps) ?? 0,
      sets: getNumber(p.Sets) ?? 1,
      dropWeightKg: getNumber(p.DropWeight),
      dropReps: getNumber(p.DropReps),
    };
  },

  toProperties: (data: CreateExerciseRecordInput): Record<string, unknown> => ({
    Name: { title: [{ text: { content: crypto.randomUUID() } }] },
    ExerciseName: { rich_text: [{ text: { content: data.exerciseName } }] },
    Exercise: { relation: [{ id: data.exerciseId }] },
    Date: { date: { start: data.date } },
    Weight: { number: data.weightKg },
    Reps: { number: data.reps },
    Sets: { number: data.sets },
    ...(data.dropWeightKg !== null && data.dropWeightKg > 0
      ? {
          DropWeight: { number: data.dropWeightKg },
          DropReps: { number: data.dropReps ?? 0 },
        }
      : {}),
  }),
};
