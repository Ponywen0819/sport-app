import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export type Exercise = {
  id: string;
  name: string;
  equipment: string;
  muscleGroups: string[];
};

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
    return {
      id: page.id,
      name: getText(p.Name),
      equipment: getSelect(p.Equipment),
      muscleGroups: getMultiSelect(p.MuscleGroup),
    };
  },
};
