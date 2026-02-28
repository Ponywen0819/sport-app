"use client";

import {
  getCurrentDate,
  getDaysInMonth,
  getFirstDayOfMonth,
  getMonthAbbreviation,
} from "@/utils/time";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

type DateSelectorContext = {
  selectedDate: CalendarDate;
  displayYear: number;
  displayMonth: number;
  onSelectDate: (date: CalendarDate) => void;
  hints: Record<string, string[]>;
};

const context = createContext<DateSelectorContext | null>(null);

const useDateSelectorContext = () => {
  const useContextReturn = useContext(context);

  if (!useContextReturn) throw new Error("context provider is missing");

  return useContextReturn;
};

export type DateSelectorProps = {
  value?: CalendarDate;
  onSelect?: (date: CalendarDate) => void;
  /** key: "YYYY-MM-DD"，value: Tailwind bg color class 陣列，e.g. ["bg-blue-400", "bg-green-400"] */
  hints?: Record<string, string[]>;
  onMonthChange?: (year: number, month: number) => void;
};

export const DateSelector = (props: DateSelectorProps) => {
  const defaultSelectedDate = useMemo(() => getCurrentCalendarDate(), []);

  const [selectedDate, setSelectedDate] = useState(defaultSelectedDate);
  const [displayYear, setDisplayYear] = useState(defaultSelectedDate.year);
  const [displayMonth, setDisplayMonth] = useState(defaultSelectedDate.month);

  useEffect(() => {
    if (!props.value) return;
    const valueIsChanged = (["year", "month", "day"] as const).every(
      (key) => props.value![key] === selectedDate[key]
    );
    if (!valueIsChanged) return;
    setSelectedDate(props.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  useEffect(() => {
    props.onMonthChange?.(displayYear, displayMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayYear, displayMonth]);

  const handleSwitchToNextMonth = () => {
    const [nextYear, nextMonth] = getNextYearAndMonth(
      displayYear,
      displayMonth
    );

    setDisplayYear(nextYear);
    setDisplayMonth(nextMonth);
  };

  const handleSwitchToPreviousMonth = () => {
    const [previousYear, previousMonth] = getPreviousYearAndMonth(
      displayYear,
      displayMonth
    );

    setDisplayYear(previousYear);
    setDisplayMonth(previousMonth);
  };

  const handleBackToToday = () => {
    const currentDate = getCurrentDate();

    setDisplayYear(currentDate.getFullYear());
    setDisplayMonth(currentDate.getMonth());
  };

  const handleSelectDate = (date: CalendarDate) => {
    const { year, month } = date;

    setDisplayYear(year);
    setDisplayMonth(month);

    setSelectedDate(() => ({ ...date }));
    props.onSelect?.(date);
  };

  const value = useMemo<DateSelectorContext>(
    () => ({
      selectedDate: selectedDate,
      displayYear: displayYear,
      displayMonth: displayMonth,
      onSelectDate: handleSelectDate,
      hints: props.hints ?? {},
    }),
    [selectedDate, displayYear, displayMonth, props.hints]
  );

  return (
    <context.Provider value={value}>
      <div className="bg-stone-800 rounded-2xl p-4 w-full">
        <MonthNavigator
          onNextMonth={handleSwitchToNextMonth}
          onPrevMonth={handleSwitchToPreviousMonth}
        />
        <WeekdayHeader />
        <Calendar />
        <div className="flex justify-end mt-3">
          <BackToTodayBotton onClick={handleBackToToday} />
        </div>
      </div>
    </context.Provider>
  );
};

type MonthNavigatorProps = {
  monthDisplay?: string;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
};

export const MonthNavigator = (props: MonthNavigatorProps) => {
  const { onPrevMonth, onNextMonth } = props;
  const { displayYear, displayMonth } = useDateSelectorContext();

  const monthAbbrev = getMonthAbbreviation(displayMonth);
  const monthDisplay = `${displayYear} · ${monthAbbrev}`;

  return (
    <div className="flex justify-between items-center mb-4">
      <button
        onClick={onPrevMonth}
        className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-700 transition-colors"
        aria-label="previous month"
      >
        <FaChevronLeft size={12} />
      </button>
      <span className="text-stone-200 text-sm font-semibold">{monthDisplay}</span>
      <button
        onClick={onNextMonth}
        className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-700 transition-colors"
        aria-label="next month"
      >
        <FaChevronRight size={12} />
      </button>
    </div>
  );
};

const WeekdayHeader = () => {
  const daysAbbr = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
  return (
    <div className="grid grid-cols-7 text-center mb-2">
      {daysAbbr.map((day, index) => (
        <div
          key={index}
          className={`text-xs font-medium py-1 ${
            index === 0 || index === 6 ? "text-rose-400/70" : "text-stone-500"
          }`}
        >
          {day}
        </div>
      ))}
    </div>
  );
};

const Calendar = () => {
  const { displayYear, displayMonth } = useDateSelectorContext();
  const offset = getFirstDayOfMonth(displayYear, displayMonth);

  const currentDays = getDaysInMonth(displayYear, displayMonth);

  const [previousYaer, previousMonth] = getPreviousYearAndMonth(
    displayYear,
    displayMonth
  );
  const [nextYear, nextMonth] = getNextYearAndMonth(displayYear, displayMonth);

  const previousDays = getDaysInMonth(previousYaer, previousMonth);

  const previousMonthDates: DateButtonProps[] = Array.from(
    { length: offset },
    (_, i) => ({
      year: previousYaer,
      month: previousMonth,
      day: previousDays - offset + i + 1,
    })
  );

  const currentMonthDates: DateButtonProps[] = Array.from(
    { length: currentDays },
    (_, i) => ({
      year: displayYear,
      month: displayMonth,
      day: i + 1,
    })
  );

  const remainDates = 42 - offset - currentDays;
  const nextMonthDates: DateButtonProps[] = Array.from(
    { length: remainDates },
    (_, i) => ({
      year: nextYear,
      month: nextMonth,
      day: i + 1,
    })
  );

  const dates = [
    ...previousMonthDates,
    ...currentMonthDates,
    ...nextMonthDates,
  ];

  return (
    <div className="grid grid-cols-7 gap-y-1 text-center">
      {dates.map((props, index) => (
        <DateButton key={index} {...props} />
      ))}
    </div>
  );
};

const getPreviousYearAndMonth = (year: number, month: number) => {
  const previousYear = month === 0 ? year - 1 : year;
  const previousMonth = (month + 11) % 12;
  return [previousYear, previousMonth];
};

const getNextYearAndMonth = (year: number, month: number) => {
  const nextYear = month === 11 ? year + 1 : year;
  const nextMonth = (month + 1) % 12;
  return [nextYear, nextMonth];
};

type DateButtonProps = CalendarDate;

const DateButton = (props: DateButtonProps) => {
  const { year, month, day } = props;
  const { displayYear, displayMonth, selectedDate, onSelectDate, hints } =
    useDateSelectorContext();
  const currentDate = getCurrentCalendarDate();

  const isSelectedDate =
    year === selectedDate.year &&
    month === selectedDate.month &&
    day === selectedDate.day;
  const isCurrentDate =
    year === currentDate.year &&
    month === currentDate.month &&
    day === currentDate.day;
  const isDisplayingMonth = year === displayYear && month === displayMonth;

  const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const dateHints = hints[dateKey] ?? [];

  const handleClick = () => onSelectDate(props);

  return (
    <button
      onClick={handleClick}
      className={`relative mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors
        ${isSelectedDate
          ? "bg-blue-500 text-white font-semibold"
          : isDisplayingMonth
          ? "text-stone-200 hover:bg-stone-700"
          : "text-stone-600 hover:bg-stone-700/50"
        }
      `}
    >
      {day}
      {/* 今天指示點（無提示點時顯示） */}
      {isCurrentDate && !isSelectedDate && dateHints.length === 0 && (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
      )}
      {/* 提示點 */}
      {dateHints.length > 0 && (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
          {dateHints.slice(0, 3).map((color, i) => (
            <span key={i} className={`w-1 h-1 rounded-full ${color}`} />
          ))}
        </span>
      )}
    </button>
  );
};

type BackToTodayBottonProps = {
  onClick?: () => void;
};

const BackToTodayBotton = (props: BackToTodayBottonProps) => {
  const { onClick } = props;
  const { displayYear, displayMonth } = useDateSelectorContext();
  const today = getCurrentDate();

  const isCurrentMonth =
    displayYear === today.getFullYear() && displayMonth === today.getMonth();

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-lg border border-stone-600 text-stone-400 hover:text-stone-200 hover:border-stone-500 transition-colors ${
        isCurrentMonth ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      今天
    </button>
  );
};

export const getCurrentCalendarDate = (): CalendarDate => {
  const currentDate = getCurrentDate();
  return {
    year: currentDate.getFullYear(),
    month: currentDate.getMonth(),
    day: currentDate.getDate(),
  };
};
