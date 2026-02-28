"use client";

import { CalendarDate } from "@/components/date-selector";
import { getNutritionOverview } from "@/lib/api/nutrition";
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

  const { data, isLoading } = useQuery({
    queryKey: ["nutrition-overview", dateStr],
    queryFn: () => getNutritionOverview(dateStr),
  });

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
