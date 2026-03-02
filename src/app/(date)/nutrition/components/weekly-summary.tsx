"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { getWeeklySummary } from "@/lib/api/nutrition";
import { useNutritionGoals } from "@/providers/nutrition-goals-provider";
import type { CalendarDate } from "@/components/date-selector";

type Props = { date: CalendarDate };

const toDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getWeekRange = (date: CalendarDate): { from: string; to: string } => {
  const d = new Date(date.year, date.month, date.day);
  const dow = d.getDay(); // 0=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((dow + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toDateStr(monday), to: toDateStr(sunday) };
};

export const WeeklySummary = ({ date }: Props) => {
  const [expanded, setExpanded] = useState(true);
  const goals = useNutritionGoals((s) => s.goals);
  const hasGoals = goals.calories > 0;

  const { from, to } = useMemo(() => getWeekRange(date), [date]);

  const { data: dailies = [], isLoading } = useQuery({
    queryKey: ["weekly-summary", from, to],
    queryFn: () => getWeeklySummary(from, to),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-stone-800 rounded-2xl px-4 py-3 animate-pulse h-14" />
    );
  }

  if (dailies.length === 0) return null;

  const recordedDays = dailies.length;
  const avgCalories = Math.round(dailies.reduce((s, d) => s + d.calories, 0) / recordedDays);
  const avgProtein = Math.round(dailies.reduce((s, d) => s + d.protein, 0) / recordedDays);
  const calorieGoalDays = hasGoals
    ? dailies.filter((d) => d.calories >= goals.calories * 0.9).length
    : 0;

  // Build 7-day array (Mon–Sun)
  const days: { label: string; dateStr: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const labels = ["一", "二", "三", "四", "五", "六", "日"];
    days.push({ label: labels[i], dateStr: toDateStr(d) });
  }

  return (
    <div className="bg-stone-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <span className="text-stone-300 text-sm font-semibold">本週摘要</span>
          <span className="text-stone-500 text-xs">{from.slice(5)} – {to.slice(5)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-stone-500 text-xs">{recordedDays}/7 天</span>
          {expanded ? (
            <IoChevronUp size={14} className="text-stone-500" />
          ) : (
            <IoChevronDown size={14} className="text-stone-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {/* 每日卡路里橫條 */}
          <div className="flex gap-1 items-end h-10">
            {days.map(({ label, dateStr }) => {
              const day = dailies.find((d) => d.date === dateStr);
              const ratio = day && hasGoals ? Math.min(day.calories / goals.calories, 1) : null;
              const hasRecord = !!day;
              return (
                <div key={dateStr} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-stone-700 rounded-sm h-8 flex items-end overflow-hidden">
                    {hasRecord && (
                      <div
                        className={`w-full rounded-sm transition-all ${
                          ratio !== null
                            ? ratio >= 0.9
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                            : "bg-stone-500"
                        }`}
                        style={{ height: ratio !== null ? `${Math.max(ratio * 100, 15)}%` : "40%" }}
                      />
                    )}
                  </div>
                  <span className="text-stone-600 text-[10px]">{label}</span>
                </div>
              );
            })}
          </div>

          {/* 統計數字 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-stone-700/50 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
              <p className="text-stone-500 text-[10px]">均卡路里</p>
              <p className="text-stone-100 text-sm font-semibold">{avgCalories}</p>
              {hasGoals && (
                <p className="text-stone-600 text-[10px]">目標 {goals.calories}</p>
              )}
            </div>
            <div className="bg-stone-700/50 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
              <p className="text-stone-500 text-[10px]">均蛋白質</p>
              <p className="text-emerald-400 text-sm font-semibold">{avgProtein}g</p>
              {hasGoals && goals.protein > 0 && (
                <p className="text-stone-600 text-[10px]">目標 {goals.protein}g</p>
              )}
            </div>
            <div className="bg-stone-700/50 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
              <p className="text-stone-500 text-[10px]">達標天數</p>
              <p className="text-blue-400 text-sm font-semibold">
                {hasGoals ? `${calorieGoalDays}/7` : `${recordedDays}/7`}
              </p>
              <p className="text-stone-600 text-[10px]">{hasGoals ? "≥90% 目標" : "有記錄"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
