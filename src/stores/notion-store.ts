import { createStore } from "zustand/vanilla";
import Cookies from "js-cookie";

export type NotionSettings = {
  token: string;
  foodsDbId: string;
  mealItemsDbId: string;
  exerciseRecordsDbId: string;
  exercisesDbId: string;
  bodyIndexesDbId: string;
};

export type NotionStore = {
  settings: NotionSettings;
  setSettings: (settings: NotionSettings) => void;
};

export const LOCAL_STORAGE_KEY = "notion-settings";

export const defaultNotionSettings: NotionSettings = {
  token: "",
  foodsDbId: "",
  mealItemsDbId: "",
  exerciseRecordsDbId: "",
  exercisesDbId: "",
  bodyIndexesDbId: "",
};

export function syncNotionCookies(settings: NotionSettings) {
  const opts = { expires: 365 };
  Cookies.set("notion_token", settings.token, opts);
  Cookies.set("notion_foods_db_id", settings.foodsDbId, opts);
  Cookies.set("notion_meal_items_db_id", settings.mealItemsDbId, opts);
  Cookies.set("notion_exercise_records_db_id", settings.exerciseRecordsDbId, opts);
  Cookies.set("notion_exercises_db_id", settings.exercisesDbId, opts);
  Cookies.set("notion_body_indexes_db_id", settings.bodyIndexesDbId, opts);
}

export const createNotionStore = () =>
  createStore<NotionStore>()((set) => ({
    settings: defaultNotionSettings,
    setSettings: (settings) => {
      set({ settings });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
      syncNotionCookies(settings);
    },
  }));
