import React from "react";
import ProgressBar from "@/components/progress-bar";

export const PlanOverview = () => {
  // 範例資料：假設一個 7 天的週期，目前進行到第 4 天
  const currentCycleDay = 4;
  const totalCycleDays = 7;
  const progressPercentage = Math.round(
    (currentCycleDay / totalCycleDays) * 100
  );

  // 根據週期規則：奇數天顯示「專項運動」，偶數天顯示「休息日」
  const currentPlan = currentCycleDay % 2 === 1 ? "專項運動" : "休息日";

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 min-w-md w-full mx-auto">
      <h2 className="text-lg font-semibold mb-4">週期計劃概覽</h2>
      <div className="mb-4">
        <p className="text-sm text-gray-600">目前計劃：</p>
        <p className="text-xl font-bold">{currentPlan}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">
          計劃進度： {currentCycleDay} / {totalCycleDays} 天
        </p>
        <ProgressBar rate={progressPercentage} />
      </div>
    </div>
  );
};

export default PlanOverview;
