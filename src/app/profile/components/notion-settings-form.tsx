"use client";

import { useState, useEffect } from "react";
import { useNotionStore } from "@/providers/notion-store-provider";
import {
  type NotionSettings,
  LOCAL_STORAGE_KEY,
  defaultNotionSettings,
} from "@/stores/notion-store";

const FIELDS: {
  key: keyof NotionSettings;
  label: string;
  placeholder: string;
  isToken?: boolean;
}[] = [
  {
    key: "token",
    label: "Notion API Token",
    placeholder: "secret_xxxx...",
    isToken: true,
  },
  {
    key: "exerciseRecordsDbId",
    label: "運動紀錄 DB ID",
    placeholder: "32 位英數字",
  },
  {
    key: "exercisesDbId",
    label: "動作資料庫 DB ID",
    placeholder: "32 位英數字",
  },
  {
    key: "mealItemsDbId",
    label: "餐點紀錄 DB ID",
    placeholder: "32 位英數字",
  },
  {
    key: "foodsDbId",
    label: "食物資料庫 DB ID",
    placeholder: "32 位英數字",
  },
  {
    key: "bodyIndexesDbId",
    label: "身體指標 DB ID",
    placeholder: "32 位英數字",
  },
];

export function NotionSettingsForm() {
  const setSettings = useNotionStore((s) => s.setSettings);

  const [form, setForm] = useState<NotionSettings>(() => {
    if (typeof window === "undefined") return defaultNotionSettings;
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return defaultNotionSettings;
    try {
      return JSON.parse(stored);
    } catch {
      return defaultNotionSettings;
    }
  });

  const [saved, setSaved] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const handleChange = (key: keyof NotionSettings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSettings(form);
    setSaved(true);
  };

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  return (
    <div className="flex flex-col gap-4">
      {FIELDS.map(({ key, label, placeholder, isToken }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <label className="text-stone-400 text-xs font-medium">{label}</label>
          <div className="relative">
            <input
              type={isToken && !showToken ? "password" : "text"}
              value={form[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
              className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2.5 text-stone-100 text-sm placeholder:text-stone-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {isToken && (
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs hover:text-stone-300"
              >
                {showToken ? "隱藏" : "顯示"}
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        className="mt-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
      >
        儲存設定
      </button>

      {saved && (
        <p className="text-emerald-400 text-xs text-center">
          ✓ 設定已儲存，下次開啟 App 時自動套用
        </p>
      )}

      <p className="text-stone-600 text-xs text-center">
        資料庫 ID 可從 Notion 資料庫 URL 中取得（32 位英數字）
      </p>
    </div>
  );
}
