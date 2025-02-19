"use client";

import { CalendarDate } from "@/components/date-selector";
import { useNutritionOverview } from "@/lib/api-hook/nutrition";
import { getNutritionOverview } from "@/lib/api/nutrition";
import { selectIsLogin, useAuthStore } from "@/providers/auth-store-provider";
import { useDateStore } from "@/providers/date-store-provider";
import { GetNutritionOverResponseSchema } from "@/schema/nutrition-schema";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import React from "react";

type NutritionOverviewProps = { date: CalendarDate };

export const NutritionOverview = (props: NutritionOverviewProps) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-4 w-xs text-stone-900">
      <h2 className="text-lg font-semibold mb-4">Nutrition Intake</h2>
      <MainContent {...props} />
    </div>
  );
};

const MainContent = (props: NutritionOverviewProps) => {
  const { date } = props;

  const isLogin = selectIsLogin();
  const { data, isLoading } = useNutritionOverview(date, isLogin);
  if (!isLogin) return <UnauthDisplay />;

  if (!data || isLoading) return <OverviewLoading />;
  return <Overview {...data.nutrition} />;
};

const UnauthDisplay = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center h-16"
    >
      <p className="font-bold">Login to get info</p>
    </motion.div>
  );
};

const OverviewLoading = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center h-16"
    >
      <p className="font-bold">Loading...</p>
    </motion.div>
  );
};

type OverviewProps = Zod.infer<
  typeof GetNutritionOverResponseSchema
>["nutrition"];

const Overview = (props: OverviewProps) => {
  const { calories, carbs, protein, fat } = props;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-4 gap-1 h-16"
    >
      <OverviewStat value={protein} type={StatType.Protein} />
      <OverviewStat value={fat} type={StatType.Fat} />
      <OverviewStat value={carbs} type={StatType.Carbs} />
      <OverviewStat value={calories} type={StatType.TotalCalories} />
    </motion.div>
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
