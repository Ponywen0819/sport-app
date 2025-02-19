"use client";

import {
  getCurrentDate,
  getDaysInMonth,
  getFirstDayOfMonth,
  getMonthAbbreviation,
} from "@/utils/time";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IconButton } from "./icon-botton";

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
  }, [props.value]);

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
  };

  const value = useMemo<DateSelectorContext>(
    () => ({
      selectedDate: selectedDate,
      displayYear: displayYear,
      displayMonth: displayMonth,
      onSelectDate: handleSelectDate,
    }),
    [selectedDate, displayYear, displayMonth]
  );

  return (
    <context.Provider value={value}>
      <div className="bg-white shadow-lg rounded-lg p-3  w-xs mx-auto text-stone-900">
        <MonthNavigator
          onNextMonth={handleSwitchToNextMonth}
          onPrevMonth={handleSwitchToPreviousMonth}
        />
        <WeekdayHeader />
        <Calendar />
        <div className="flex justify-end mt-4">
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

  const monthDisplay = `${displayYear} - ${monthAbbrev}`;

  return (
    <div className="flex justify-between items-center mb-4 font-bold">
      <IconButton
        icon={FaChevronLeft}
        onClick={onPrevMonth}
        size={12}
        aria-label="previous month"
      />
      <button className="text-sm text-gray-500">{monthDisplay}</button>
      <IconButton
        icon={FaChevronRight}
        onClick={onNextMonth}
        size={12}
        aria-label="next month"
      />
    </div>
  );
};

const WeekdayHeader = () => {
  const daysAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
  return (
    <div className="grid grid-cols-7 gap-1 text-center mb-2">
      {daysAbbr.map((day, index) => (
        <WeekdayName key={index} day={day} />
      ))}
    </div>
  );
};

type WeekdayNameProps = {
  day: "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
};

const WeekdayName = (props: WeekdayNameProps) => {
  const { day } = props;
  const isWeekend = day === "Sun" || day === "Sat";
  const textColor = isWeekend ? "text-red-500" : "text-gray-400";
  const className = `text-xs font-bold ${textColor}`;
  return <div className={className}>{day}</div>;
};

const Calendar = () => {
  const { displayYear, displayMonth } = useDateSelectorContext();
  const offset = getFirstDayOfMonth(displayYear, displayMonth);

  const currentDays = getDaysInMonth(displayYear, displayMonth);

  const nextMonthDays = 42 - (currentDays + offset);

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
    <div className="grid grid-cols-7 gap-2 text-center grid-rows-6">
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
  const { displayYear, displayMonth, selectedDate, onSelectDate } =
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

  const className = `py-2 rounded-full text-sm hover:bg-blue-100 hover:text-gray-500 transition-all duration-200 relative
    ${
      isCurrentDate
        ? "after:content-['']  after:absolute after:w-3 after:border-b-2 after:border-gray-700 after:bottom-1/2 after:left-1/2  after:-translate-x-1/2 after:translate-y-3"
        : ""
    }
    ${isCurrentDate && isSelectedDate ? "after:border-white" : ""}
    ${
      isSelectedDate
        ? "bg-blue-300 text-white"
        : isDisplayingMonth
        ? "text-gray-700"
        : "text-gray-400"
    }
    `;

  const handleClick = () => onSelectDate(props);

  return (
    <button className={className} onClick={handleClick}>
      {day}
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
  const className = ` px-2  text-xs rounded-sm border-2 border-gray-400 bg-gray-400 text-white hover:text-gray-400 hover:bg-white hover:text-gray-300 transition-all duration-200 shadow-sm
    ${isCurrentMonth ? "opacity-0" : "opacity-100"}
  `;

  return (
    <button className={className} onClick={onClick}>
      Today
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
