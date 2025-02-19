import React from "react";

// MealTracker 為整體容器，包含四個不同餐點的 MealLog
export const MealTracker = () => {
  return (
    <div className="space-y-4 w-full">
      <MealLog mealType="Breakfast" />
      <MealLog mealType="Lunch" />
      <MealLog mealType="Dinner" />
      <MealLog mealType="Snack" />
    </div>
  );
};

type MealLogProps = {
  mealType: string;
};

// MealLog 以卡片方式呈現，內部使用表格展示該餐點的食物紀錄
const MealLog = ({ mealType }: MealLogProps) => {
  // 更新後的範例資料，包含重量與三大營養素數值
  const sampleFoods = [
    {
      name: "Apple",
      weight: "150g",
      calories: 95,
      protein: "0.5g",
      fat: "0.3g",
      carbs: "25g",
    },
    {
      name: "Banana",
      weight: "100g",
      calories: 105,
      protein: "1.3g",
      fat: "0.4g",
      carbs: "27g",
    },
  ];

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 min-w-md grid grid-cols-[7rem_1fr] gap-2">
      <h2 className="text-lg font-semibold mb-4">{mealType}</h2>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="px-2 py-1 text-left text-xs text-gray-600">Food</th>
            <th className="px-2 py-1 text-left text-xs text-gray-600">
              Weight
            </th>
            <th className="px-2 py-1 text-left text-xs text-gray-600">
              Calories
            </th>
            <th className="px-2 py-1 text-left text-xs text-gray-600">
              Protein
            </th>
            <th className="px-2 py-1 text-left text-xs text-gray-600">Fat</th>
            <th className="px-2 py-1 text-left text-xs text-gray-600">Carbs</th>
          </tr>
        </thead>
        <tbody>
          {sampleFoods.map((item, index) => (
            <tr key={index}>
              <td className="px-2 py-1 text-sm">{item.name}</td>
              <td className="px-2 py-1 text-sm">{item.weight}</td>
              <td className="px-2 py-1 text-sm">{item.calories}</td>
              <td className="px-2 py-1 text-sm">{item.protein}</td>
              <td className="px-2 py-1 text-sm">{item.fat}</td>
              <td className="px-2 py-1 text-sm">{item.carbs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export { MealLog };
