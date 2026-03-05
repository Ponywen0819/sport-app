"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateSelector, type CalendarDate } from "@/components/date-selector";
import { ExerciseTracker } from "./exercise-tracker";
import { WeeklyWorkoutSummary } from "./weekly-workout-summary";
import { getExerciseRecordDates } from "@/lib/api/exercise";

const getTodayCalendarDate = (): CalendarDate => {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
};

export const WorkoutsClient = () => {
  const [date, setDate] = useState<CalendarDate>(getTodayCalendarDate);
  const [displayYear, setDisplayYear] = useState(() => getTodayCalendarDate().year);
  const [displayMonth, setDisplayMonth] = useState(() => getTodayCalendarDate().month);

  const startDate = useMemo(() => {
    const m = String(displayMonth + 1).padStart(2, "0");
    return `${displayYear}-${m}-01`;
  }, [displayYear, displayMonth]);

  const endDate = useMemo(() => {
    const lastDay = new Date(displayYear, displayMonth + 1, 0).getDate();
    const m = String(displayMonth + 1).padStart(2, "0");
    const d = String(lastDay).padStart(2, "0");
    return `${displayYear}-${m}-${d}`;
  }, [displayYear, displayMonth]);

  const { data: recordDates = [] } = useQuery({
    queryKey: ["exercise-dates", startDate, endDate],
    queryFn: () => getExerciseRecordDates(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });

  const hints = useMemo<Record<string, string[]>>(() => {
    const result: Record<string, string[]> = {};
    for (const d of recordDates) {
      result[d] = ["bg-emerald-400"];
    }
    return result;
  }, [recordDates]);

  return (
    <>
      <div className="px-4 pb-2">
        <DateSelector
          value={date}
          onSelect={setDate}
          hints={hints}
          onMonthChange={(y, m) => {
            setDisplayYear(y);
            setDisplayMonth(m);
          }}
        />
      </div>
      <div className="px-4 pb-3">
        <WeeklyWorkoutSummary />
      </div>
      <div className="px-4 pb-4">
        <ExerciseTracker date={date} />
      </div>
    </>
  );
};
