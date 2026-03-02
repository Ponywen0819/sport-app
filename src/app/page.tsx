"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IoNutritionOutline } from "react-icons/io5";
import { MdOutlineFitnessCenter } from "react-icons/md";
import { getExerciseRecordDates } from "@/lib/api/exercise";
import { getNutritionOverview } from "@/lib/api/nutrition";
import { getLatestBodyIndex } from "@/lib/api/body-index";
import { useNutritionGoals } from "@/providers/nutrition-goals-provider";

const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

function getThisWeekDates(): string[] {
  const today = new Date();
  const daysFromMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

function getTodayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export default function Home() {
  const weekDates = useMemo(() => getThisWeekDates(), []);
  const today = useMemo(() => getTodayString(), []);
  const goals = useNutritionGoals((s) => s.goals);

  const { data: trainingDateList = [] } = useQuery({
    queryKey: ["exercise-dates", weekDates[0], weekDates[6]],
    queryFn: () => getExerciseRecordDates(weekDates[0], weekDates[6]),
    staleTime: 5 * 60 * 1000,
  });

  const { data: todayNutrition } = useQuery({
    queryKey: ["nutrition-overview", today],
    queryFn: () => getNutritionOverview(today),
    staleTime: 5 * 60 * 1000,
  });

  const { data: latestBodyIndex } = useQuery({
    queryKey: ["body-index", "latest"],
    queryFn: getLatestBodyIndex,
    staleTime: 10 * 60 * 1000,
  });

  const trainingDates = useMemo(() => new Set(trainingDateList), [trainingDateList]);
  const trainedCount = weekDates.filter((d) => trainingDates.has(d)).length;
  const hasNutritionGoals = goals.calories > 0 || goals.protein > 0;
  const caloriePct = goals.calories > 0 && todayNutrition
    ? Math.min((todayNutrition.calories / goals.calories) * 100, 100)
    : 0;
  const proteinPct = goals.protein > 0 && todayNutrition
    ? Math.min((todayNutrition.protein / goals.protein) * 100, 100)
    : 0;

  return (
    <div className="px-4 py-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-stone-100">運動紀錄</h1>
      </div>

      {/* 本週訓練 */}
      <div className="bg-stone-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-stone-300 font-semibold text-sm">本週訓練</h2>
          <span className="text-stone-400 text-xs">
            <span className="text-emerald-400 font-semibold">{trainedCount}</span>
            <span> / 7 天</span>
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date, i) => {
            const isTrained = trainingDates.has(date);
            const isToday = date === today;
            return (
              <div key={date} className="flex flex-col items-center gap-1.5">
                <span className={`text-xs font-medium ${isToday ? "text-stone-200" : "text-stone-500"}`}>
                  {DAY_LABELS[i]}
                </span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    isTrained ? "bg-emerald-500/20 border-emerald-500/50" : "border-stone-700"
                  } ${isToday ? "ring-2 ring-offset-1 ring-offset-stone-800 ring-blue-400" : ""}`}
                >
                  {isTrained && <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 今日營養摘要（需設定目標才顯示） */}
      {hasNutritionGoals && todayNutrition && (
        <Link href="/nutrition" className="bg-stone-800 rounded-2xl p-4 flex flex-col gap-3 active:bg-stone-700 transition-colors">
          <h2 className="text-stone-300 font-semibold text-sm">今日營養</h2>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 text-xs">熱量</span>
                <span className="text-red-400 text-xs font-medium">
                  {Math.round(todayNutrition.calories)}
                  {goals.calories > 0 && <span className="text-stone-600"> / {goals.calories} kcal</span>}
                </span>
              </div>
              {goals.calories > 0 && (
                <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${caloriePct}%` }} />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 text-xs">蛋白質</span>
                <span className="text-blue-400 text-xs font-medium">
                  {Math.round(todayNutrition.protein)}
                  {goals.protein > 0 && <span className="text-stone-600"> / {goals.protein} g</span>}
                </span>
              </div>
              {goals.protein > 0 && (
                <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${proteinPct}%` }} />
                </div>
              )}
            </div>
          </div>
        </Link>
      )}

      {/* 最新身體指標 */}
      {latestBodyIndex && (
        <Link href="/profile/body-index" className="bg-stone-800 rounded-2xl p-4 flex flex-col gap-3 active:bg-stone-700 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-stone-300 font-semibold text-sm">身體指標</h2>
            <span className="text-stone-600 text-xs">{latestBodyIndex.date}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-stone-500 text-xs">體重</span>
              <span className="text-blue-400 text-lg font-bold">
                {latestBodyIndex.weight}
                <span className="text-xs text-stone-500 ml-0.5">kg</span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-stone-500 text-xs">體脂率</span>
              <span className="text-orange-400 text-lg font-bold">
                {latestBodyIndex.bodyFatPercentage}
                <span className="text-xs text-stone-500 ml-0.5">%</span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-stone-500 text-xs">骨骼肌</span>
              <span className="text-emerald-400 text-lg font-bold">
                {latestBodyIndex.skeletalMuscleWeight}
                <span className="text-xs text-stone-500 ml-0.5">kg</span>
              </span>
            </div>
          </div>
        </Link>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-stone-400 text-xs font-medium uppercase tracking-wider">快速導航</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/nutrition"
            className="bg-stone-800 rounded-2xl p-4 flex flex-col gap-3 hover:bg-stone-700 active:bg-stone-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <IoNutritionOutline size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-stone-100 font-semibold text-sm">今日營養</p>
              <p className="text-stone-500 text-xs mt-0.5">查看飲食紀錄</p>
            </div>
          </Link>

          <Link
            href="/workouts"
            className="bg-stone-800 rounded-2xl p-4 flex flex-col gap-3 hover:bg-stone-700 active:bg-stone-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <MdOutlineFitnessCenter size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-stone-100 font-semibold text-sm">運動記錄</p>
              <p className="text-stone-500 text-xs mt-0.5">追蹤訓練進度</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
