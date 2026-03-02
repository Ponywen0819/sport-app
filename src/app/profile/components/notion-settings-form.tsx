"use client";

import { useState, useEffect } from "react";
import { useNotionStore } from "@/providers/notion-store-provider";
import {
  type NotionSettings,
  LOCAL_STORAGE_KEY,
  defaultNotionSettings,
} from "@/stores/notion-store";
import { IoCheckmark, IoClose } from "react-icons/io5";

const FIELDS: {
  key: keyof NotionSettings;
  label: string;
  placeholder: string;
  isToken?: boolean;
  validateKey?: string;
}[] = [
  {
    key: "token",
    label: "Notion API Token",
    placeholder: "secret_xxxx...",
    isToken: true,
    validateKey: "token",
  },
  {
    key: "exerciseRecordsDbId",
    label: "運動紀錄 DB ID",
    placeholder: "32 位英數字",
    validateKey: "exerciseRecordsDb",
  },
  {
    key: "exercisesDbId",
    label: "動作資料庫 DB ID",
    placeholder: "32 位英數字",
    validateKey: "exercisesDb",
  },
  {
    key: "mealItemsDbId",
    label: "餐點紀錄 DB ID",
    placeholder: "32 位英數字",
    validateKey: "mealItemsDb",
  },
  {
    key: "foodsDbId",
    label: "食物資料庫 DB ID",
    placeholder: "32 位英數字",
    validateKey: "foodsDb",
  },
  {
    key: "bodyIndexesDbId",
    label: "身體指標 DB ID",
    placeholder: "32 位英數字",
    validateKey: "bodyIndexesDb",
  },
];

type ValidationResult = {
  token: boolean;
  foodsDb: boolean;
  mealItemsDb: boolean;
  exerciseRecordsDb: boolean;
  exercisesDb: boolean;
  bodyIndexesDb: boolean;
} | null;

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
  const [isTesting, setIsTesting] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>(null);

  const handleChange = (key: keyof NotionSettings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setValidation(null);
  };

  const handleSave = () => {
    setSettings(form);
    setSaved(true);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setValidation(null);
    try {
      const res = await fetch("/api/notion/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      setValidation(result);
    } catch {
      setValidation(null);
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  return (
    <div className="flex flex-col gap-4">
      {FIELDS.map(({ key, label, placeholder, isToken, validateKey }) => {
        const status = validation && validateKey ? validation[validateKey as keyof ValidationResult & string] : undefined;
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-stone-400 text-xs font-medium">{label}</label>
              {status !== undefined && (
                <span className={`text-xs flex items-center gap-1 ${status ? "text-emerald-400" : "text-red-400"}`}>
                  {status ? <IoCheckmark size={12} /> : <IoClose size={12} />}
                  {status ? "已連線" : "無法連線"}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={isToken && !showToken ? "password" : "text"}
                value={form[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                autoComplete="off"
                className={`w-full bg-stone-900 border rounded-xl px-3 py-2.5 text-stone-100 text-sm placeholder:text-stone-600 focus:outline-none focus:border-blue-500 transition-colors ${
                  status === true ? "border-emerald-500/50" : status === false ? "border-red-500/50" : "border-stone-700"
                }`}
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
        );
      })}

      <div className="flex gap-2 mt-1">
        <button
          onClick={handleTest}
          disabled={isTesting || !form.token}
          className="flex-1 bg-stone-700 hover:bg-stone-600 active:bg-stone-500 disabled:opacity-40 text-stone-200 text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          {isTesting ? "測試中..." : "測試連線"}
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          儲存設定
        </button>
      </div>

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
