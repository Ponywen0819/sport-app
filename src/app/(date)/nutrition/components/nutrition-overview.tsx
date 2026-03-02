"use client";

import { CalendarDate } from "@/components/date-selector";
import { getNutritionOverview } from "@/lib/api/nutrition";
import { useNutritionGoals } from "@/providers/nutrition-goals-provider";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";

type NutritionOverviewProps = { date: CalendarDate };

const formatDate = (date: CalendarDate): string => {
  const y = date.year.toString().padStart(4, "0");
  const m = (date.month + 1).toString().padStart(2, "0");
  const d = date.day.toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const NutritionOverview = (props: NutritionOverviewProps) => {
  const { date } = props;
  const dateStr = formatDate(date);
  const goals = useNutritionGoals((s) => s.goals);

  const { data, isLoading } = useQuery({
    queryKey: ["nutrition-overview", dateStr],
    queryFn: () => getNutritionOverview(dateStr),
  });

  const hasGoals = goals.calories > 0 || goals.protein > 0;

  if (isLoading || !data) {
    return (
      <div className="bg-stone-800 rounded-2xl p-4 grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="h-3 w-10 bg-stone-700 rounded animate-pulse" />
            <div className="h-6 w-8 bg-stone-700 rounded animate-pulse" />
            <div className="h-2 w-12 bg-stone-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (hasGoals) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-stone-800 rounded-2xl p-4 flex flex-col gap-3"
      >
        <GoalRow label="熱量" value={data.calories} goal={goals.calories} unit="kcal" color="bg-red-400" textColor="text-red-400" />
        <GoalRow label="蛋白質" value={data.protein} goal={goals.protein} unit="g" color="bg-blue-400" textColor="text-blue-400" />
        <GoalRow label="碳水" value={data.carbs} goal={goals.carbs} unit="g" color="bg-green-400" textColor="text-green-400" />
        <GoalRow label="脂肪" value={data.fat} goal={goals.fat} unit="g" color="bg-yellow-400" textColor="text-yellow-400" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-stone-800 rounded-2xl p-4 grid grid-cols-4 gap-2"
    >
      <NutritionStat label="蛋白質" value={data.protein} unit="g" color="text-blue-400" />
      <NutritionStat label="脂肪" value={data.fat} unit="g" color="text-yellow-400" />
      <NutritionStat label="碳水" value={data.carbs} unit="g" color="text-green-400" />
      <NutritionStat label="熱量" value={data.calories} unit="kcal" color="text-red-400" />
    </motion.div>
  );
};

const GoalRow = ({
  label,
  value,
  goal,
  unit,
  color,
  textColor,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  textColor: string;
}) => {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const isOver = goal > 0 && value > goal;
  const remaining = goal - Math.round(value);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-stone-400 text-xs">{label}</span>
        <div className="flex items-center gap-1">
          <span className={`text-sm font-bold ${textColor}`}>{Math.round(value)}</span>
          {goal > 0 && (
            <span className="text-stone-600 text-xs">/ {goal} {unit}</span>
          )}
        </div>
      </div>
      {goal > 0 && (
        <>
          <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isOver ? "bg-red-500" : color}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className={`text-xs ${isOver ? "text-red-400" : "text-stone-500"}`}>
            {isOver ? `超出 ${Math.abs(remaining)} ${unit}` : `還差 ${remaining} ${unit}`}
          </p>
        </>
      )}
    </div>
  );
};

const NutritionStat = ({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) => (
  <div className="flex flex-col items-center gap-0.5">
    <span className="text-stone-400 text-xs">{label}</span>
    <span className={`text-lg font-bold ${color}`}>{Math.round(value)}</span>
    <span className="text-stone-600 text-[0.6rem]">{unit}</span>
  </div>
);

export default NutritionOverview;
