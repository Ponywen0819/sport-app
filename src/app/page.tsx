"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IoNutritionOutline } from "react-icons/io5";
import { MdOutlineFitnessCenter } from "react-icons/md";
import { getExerciseRecordDates } from "@/lib/api/exercise";

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

  const { data: trainingDateList = [] } = useQuery({
    queryKey: ["exercise-dates", weekDates[0], weekDates[6]],
    queryFn: () => getExerciseRecordDates(weekDates[0], weekDates[6]),
    staleTime: 5 * 60 * 1000,
  });

  const trainingDates = useMemo(() => new Set(trainingDateList), [trainingDateList]);
  const trainedCount = weekDates.filter((d) => trainingDates.has(d)).length;

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

      <div className="bg-stone-800 rounded-2xl p-4 flex flex-col gap-3">
        <h2 className="text-stone-300 font-semibold text-sm">常用功能</h2>
        <div className="flex flex-col gap-2">
          <QuickLink href="/profile" emoji="⚙️" title="Notion 設定" description="設定 Token 與資料庫 ID" />
          <QuickLink href="/nutrition" emoji="🍽️" title="記錄今日飲食" description="追蹤每餐的營養攝取" />
          <QuickLink href="/workouts" emoji="💪" title="新增運動紀錄" description="記錄今日的訓練內容" />
        </div>
      </div>
    </div>
  );
}

const QuickLink = ({ href, emoji, title, description }: { href: string; emoji: string; title: string; description: string }) => (
  <Link href={href} className="flex items-center gap-3 py-2 hover:bg-stone-700 -mx-2 px-2 rounded-xl transition-colors">
    <span className="text-xl">{emoji}</span>
    <div className="flex flex-col">
      <p className="text-stone-100 text-sm font-medium">{title}</p>
      <p className="text-stone-500 text-xs">{description}</p>
    </div>
  </Link>
);
