import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export type Exercise = {
  id: string;
  brand: string;
  machineName: string;
  equipment: string;
  muscleGroups: string[];
};

export type ExerciseInput = {
  brand: string;
  machineName: string;
  equipment: string;
  muscleGroups: string[];
};

export const getExerciseDisplayName = (
  e: Pick<Exercise, "brand" | "machineName">,
): string => [e.brand, e.machineName].filter(Boolean).join(" ").trim();

const getText = (prop: PageObjectResponse["properties"][string]): string => {
  if (prop?.type === "title") return prop.title[0]?.plain_text ?? "";
  if (prop?.type === "rich_text") return prop.rich_text[0]?.plain_text ?? "";
  return "";
};

const getSelect = (prop: PageObjectResponse["properties"][string]): string => {
  if (prop?.type === "select") return prop.select?.name ?? "";
  return "";
};

const getMultiSelect = (prop: PageObjectResponse["properties"][string]): string[] => {
  if (prop?.type === "multi_select") return prop.multi_select.map((o) => o.name);
  return [];
};

export const exerciseMapper = {
  fromPage: (page: PageObjectResponse): Exercise => {
    const p = page.properties;
    const brand = getText(p.Brand);
    const machineName = getText(p.MachineName);
    // Legacy fallback: older Notion DBs only have a Name title field.
    const fallbackName = !machineName ? getText(p.Name) : "";
    return {
      id: page.id,
      brand,
      machineName: machineName || fallbackName,
      equipment: getSelect(p.Equipment),
      muscleGroups: getMultiSelect(p.MuscleGroup),
    };
  },
  toProperties: (data: ExerciseInput): Record<string, unknown> => {
    const display = getExerciseDisplayName(data);
    return {
      Name: { title: [{ text: { content: display } }] },
      Brand: { rich_text: [{ text: { content: data.brand } }] },
      MachineName: { rich_text: [{ text: { content: data.machineName } }] },
      Equipment: data.equipment
        ? { select: { name: data.equipment } }
        : { select: null },
      MuscleGroup: { multi_select: data.muscleGroups.map((name) => ({ name })) },
    };
  },
};
