import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export type BodyIndex = {
  id: string;
  date: string;
  weight: number;
  height: number;
  bodyFatPercentage: number;
  skeletalMuscleWeight: number;
  totalWater: number;
  proteinWeight: number;
  mineralWeight: number;
  bodyFatWeight: number;
  visceralFatIndex: number;
  basalMetabolicRate: number;
};

export type CreateBodyIndexInput = Omit<BodyIndex, "id">;

const getNumber = (prop: PageObjectResponse["properties"][string]): number => {
  if (prop?.type === "number") return prop.number ?? 0;
  return 0;
};

const getDate = (prop: PageObjectResponse["properties"][string]): string => {
  if (prop?.type === "date") return prop.date?.start ?? "";
  return "";
};

export const bodyIndexMapper = {
  fromPage: (page: PageObjectResponse): BodyIndex => {
    const p = page.properties;
    return {
      id: page.id,
      date: getDate(p.Date),
      weight: getNumber(p.Weight),
      height: getNumber(p.Height),
      bodyFatPercentage: getNumber(p.BodyFatPercentage),
      skeletalMuscleWeight: getNumber(p.SkeletalMuscleWeight),
      totalWater: getNumber(p.TotalWater),
      proteinWeight: getNumber(p.ProteinWeight),
      mineralWeight: getNumber(p.MineralWeight),
      bodyFatWeight: getNumber(p.BodyFatWeight),
      visceralFatIndex: getNumber(p.VisceralFatIndex),
      basalMetabolicRate: getNumber(p.BasalMetabolicRate),
    };
  },

  toProperties: (data: CreateBodyIndexInput, name: string): Record<string, unknown> => ({
    Name: { title: [{ text: { content: name } }] },
    Date: { date: { start: data.date } },
    Weight: { number: data.weight },
    Height: { number: data.height },
    BodyFatPercentage: { number: data.bodyFatPercentage },
    SkeletalMuscleWeight: { number: data.skeletalMuscleWeight },
    TotalWater: { number: data.totalWater },
    ProteinWeight: { number: data.proteinWeight },
    MineralWeight: { number: data.mineralWeight },
    BodyFatWeight: { number: data.bodyFatWeight },
    VisceralFatIndex: { number: data.visceralFatIndex },
    BasalMetabolicRate: { number: data.basalMetabolicRate },
  }),
};
