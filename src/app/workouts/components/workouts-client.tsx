"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateSelector, type CalendarDate } from "@/components/date-selector";
import { ExerciseTracker } from "./exercise-tracker";
import { getExerciseRecordDates } from "@/lib/api/exercise";

export const WorkoutsClient = ({ initialDate }: { initialDate: CalendarDate }) => {
  const [date, setDate] = useState<CalendarDate>(initialDate);
  const [displayYear, setDisplayYear] = useState(initialDate.year);
  const [displayMonth, setDisplayMonth] = useState(initialDate.month);

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
      <div className="px-4 pb-4">
        <ExerciseTracker date={date} />
      </div>
    </>
  );
};
