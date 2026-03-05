"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWeeklyWorkoutSummary } from "@/lib/api/exercise";

const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

function getWeekRange(): { from: string; to: string; days: Date[] } {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return { from: fmt(days[0]), to: fmt(days[6]), days };
}

export function WeeklyWorkoutSummary() {
  const { from, to, days } = useMemo(() => getWeekRange(), []);

  const { data: summaries = [] } = useQuery({
    queryKey: ["weekly-workout-summary", from, to],
    queryFn: () => getWeeklyWorkoutSummary(from, to),
    staleTime: 5 * 60 * 1000,
  });

  const byDate = useMemo(() => {
    const map = new Map<string, { exerciseCount: number; totalSets: number }>();
    for (const s of summaries) {
      map.set(s.date, { exerciseCount: s.exerciseCount, totalSets: s.totalSets });
    }
    return map;
  }, [summaries]);

  const trainingDays = summaries.length;
  const totalSets = summaries.reduce((acc, s) => acc + s.totalSets, 0);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="bg-stone-800 rounded-2xl p-4">
      <h2 className="text-sm font-semibold text-stone-400 mb-3">本週訓練</h2>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {days.map((day, i) => {
          const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
          const info = byDate.get(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <div key={dateStr} className="flex flex-col items-center gap-1">
              <span className="text-xs text-stone-500">{DAY_LABELS[i]}</span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  info
                    ? "bg-emerald-500 text-white"
                    : isToday
                    ? "bg-stone-600 text-stone-100 ring-2 ring-emerald-400"
                    : "bg-stone-700 text-stone-500"
                }`}
              >
                {day.getDate()}
              </div>
              {info ? (
                <span className="text-xs text-emerald-400 font-medium">{info.exerciseCount}</span>
              ) : (
                <span className="text-xs text-transparent">-</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 pt-3 border-t border-stone-700">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-stone-100">{trainingDays}</span>
          <span className="text-xs text-stone-400">訓練天數</span>
        </div>
        <div className="w-px bg-stone-700" />
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-stone-100">{totalSets}</span>
          <span className="text-xs text-stone-400">總組數</span>
        </div>
      </div>
    </div>
  );
}
