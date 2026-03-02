"use client";

import { useState } from "react";
import { useNutritionGoals } from "@/providers/nutrition-goals-provider";
import type { NutritionGoals } from "@/stores/nutrition-goals-store";

export function NutritionGoalsForm() {
  const goals = useNutritionGoals((s) => s.goals);
  const setGoals = useNutritionGoals((s) => s.setGoals);
  const [saved, setSaved] = useState(false);

  const [values, setValues] = useState<NutritionGoals>({
    calories: goals.calories,
    protein: goals.protein,
    fat: goals.fat,
    carbs: goals.carbs,
  });

  const handleSave = () => {
    setGoals(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fields: { key: keyof NutritionGoals; label: string; unit: string }[] = [
    { key: "calories", label: "熱量目標", unit: "kcal" },
    { key: "protein", label: "蛋白質目標", unit: "g" },
    { key: "carbs", label: "碳水目標", unit: "g" },
    { key: "fat", label: "脂肪目標", unit: "g" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ key, label, unit }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label className="text-stone-400 text-xs font-medium">
              {label}
              <span className="text-stone-600 ml-1">({unit})</span>
            </label>
            <input
              type="number"
              value={values[key] || ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [key]: parseFloat(e.target.value) || 0 }))
              }
              placeholder="0"
              min="0"
              className="w-full bg-stone-700 border border-stone-600 rounded-xl px-3 py-2.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
        ))}
      </div>
      <p className="text-stone-600 text-xs">設為 0 表示不追蹤該項目</p>
      <button
        onClick={handleSave}
        className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl py-2.5 font-semibold text-sm transition-colors"
      >
        {saved ? "已儲存 ✓" : "儲存目標"}
      </button>
    </div>
  );
}
