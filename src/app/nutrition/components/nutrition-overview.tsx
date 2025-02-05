import React from "react";

export const NutritionOverview = () => {
  // 靜態範例數據，實際數據可從 API 或狀態管理取得
  const protein = 150; // 蛋白質 (g)
  const fat = 70; // 脂肪 (g)
  const carbs = 250; // 碳水化合物 (g)
  const totalCalories = 2000; // 總熱量 (kcal)

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 w-xs text-stone-900">
      <h2 className="text-lg font-semibold mb-4">Nutrition Intake</h2>
      <div className="grid grid-cols-4 gap-1">
        <OverviewStat value={protein} type={StatType.Protein} />
        <OverviewStat value={fat} type={StatType.Fat} />
        <OverviewStat value={carbs} type={StatType.Carbs} />
        <OverviewStat value={totalCalories} type={StatType.TotalCalories} />
      </div>
    </div>
  );
};

type OverviewStatProps = {
  value: number;
  type: StatType;
};

const enum StatType {
  Protein = "Protein",
  Fat = "Fat",
  Carbs = "Carbs",
  TotalCalories = "Total Calories",
}

const OverviewStat = (props: OverviewStatProps) => {
  const { value, type } = props;
  const label = getLabelByType(type);
  const unit = getUnitByType(type);
  return (
    <div className="flex flex-col items-center justify-start">
      <span className="text-xs text-gray-600">{label}</span>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[0.5rem] text-gray-400">/ 2000 {unit}</span>
    </div>
  );
};

const getLabelByType = (type: StatType) => {
  switch (type) {
    case StatType.Protein:
      return "Protein";
    case StatType.Fat:
      return "Fat";
    case StatType.Carbs:
      return "Carbs";
    case StatType.TotalCalories:
      return "Total";
  }
};

const getUnitByType = (type: StatType): string => {
  switch (type) {
    case StatType.Protein:
    case StatType.Fat:
    case StatType.Carbs:
      return "g";
    case StatType.TotalCalories:
      return "kcal";
    default:
      return "";
  }
};

export default NutritionOverview;
