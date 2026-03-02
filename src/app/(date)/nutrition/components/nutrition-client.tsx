"use client";

import { useState } from "react";
import { DateSelector, getCurrentCalendarDate, type CalendarDate } from "@/components/date-selector";
import { MealTracker } from "./meal-tracker";
import { NutritionOverview } from "./nutrition-overview";
import { SchemaMismatchBanner } from "./schema-mismatch-banner";
import { WeeklySummary } from "./weekly-summary";

export const NutritionClient = () => {
  const [date, setDate] = useState<CalendarDate>(getCurrentCalendarDate());

  return (
    <SchemaMismatchBanner>
      <div className="px-4 pb-2">
        <DateSelector value={date} onSelect={setDate} />
      </div>

      <div className="px-4 pb-3">
        <WeeklySummary date={date} />
      </div>

      <div className="px-4 pb-4">
        <NutritionOverview date={date} />
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4">
        <MealTracker mealType="Breakfast" date={date} />
        <MealTracker mealType="Lunch" date={date} />
        <MealTracker mealType="Dinner" date={date} />
        <MealTracker mealType="Snack" date={date} />
      </div>
    </SchemaMismatchBanner>
  );
};
