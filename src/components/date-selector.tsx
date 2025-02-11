"use client"

import { getCurrentDate, getDaysInMonth, getFirstDayOfMonth, getMonthAbbreviation } from "@/utils/time";
import { createContext, useContext, useMemo } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";


type DateSelectorContext = {
  currentDate: Date
}

const context = createContext<DateSelectorContext | null>(null);

const useDateSelectorContext = () => {
  const useContextReturn = useContext(context)

  if (!useContextReturn)
    throw new Error("context provider is missing")

  return useContextReturn
}


export const DateSelector = () => {
  const defaultDate = getCurrentDate()

  const value = useMemo<DateSelectorContext>(() => ({
    currentDate: defaultDate
  }), [])

  return (
    <context.Provider value={value}>
      <div className="bg-white shadow-lg rounded-lg p-3  w-xs mx-auto text-stone-900">
        <MonthNavigator />
        <WeekdayHeader />
        <Calendar />
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
  // const { monthDisplay = "2023 - Oct", onPrevMonth, onNextMonth } = props;
  const { currentDate } = useDateSelectorContext()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthAbbrev = getMonthAbbreviation(month)

  const monthDisplay = `${year} - ${monthAbbrev}`

  return (
    <div className="flex justify-between items-center mb-4 font-bold">
      <button
        // onClick={onPrevMonth}
        className="  text-gray-500 hover:text-gray-700"
      >
        <FaChevronLeft size={12} />
      </button>
      <button className="text-sm text-gray-500">{monthDisplay}</button>
      <button
        // onClick={onNextMonth}
        className="text-gray-500 hover:text-gray-700"
      >
        <FaChevronRight size={12} />
      </button>
    </div>
  );
};

const WeekdayHeader = () => {
  const daysAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
  return (
    <div className="grid grid-cols-7 gap-1 text-center mb-2">
      {daysAbbr.map((day, index) => (
        <WeekdayName
          key={index}
          day={day}
        />
      ))}
    </div>
  );
};

type WeekdayNameProps = {
  day: "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
};

const WeekdayName = (props: WeekdayNameProps) => {
  const { day } = props
  const isWeekend = day === "Sun" || day === "Sat"
  const textColor = isWeekend ? "text-red-500" : "text-gray-400";
  const className = `text-xs font-bold ${textColor}`
  return (
    <div className={className}>{day}</div>
  );
};

const Calendar = () => {
  const { currentDate } = useDateSelectorContext()
  const offset = getFirstDayByDate(currentDate)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const currentDays = getDaysInMonthByDate(currentDate)
  
  const previousDays = getPreviousMonthDays(currentDate)
  const nextMonthDays = 42 - (currentDays + offset)

  // 生成上個月的日期
  const previousMonthDates = Array.from({ length: offset }, (_, i) => ({
    year: month === 0 ? year - 1 : year,
    month: month === 0 ? 11 : month - 1,
    day: previousDays - offset + i + 1,
    isCurrentMonth: false
  }))

  // 生成當前月的日期
  const currentMonthDates = Array.from({ length: currentDays }, (_, i) => ({
    year,
    month,
    day: i + 1,
    isCurrentMonth: true
  }))

  // 生成下個月的日期
  const nextMonthDates = Array.from({ length: nextMonthDays }, (_, i) => ({
    year: month === 11 ? year + 1 : year,
    month: month === 11 ? 0 : month + 1,
    day: i + 1,
    isCurrentMonth: false
  }))

  const dates = [...previousMonthDates, ...currentMonthDates, ...nextMonthDates]

  return (
    <div className="grid grid-cols-7 gap-2 text-center">
      {dates.map((date, index) => (
        <DateButton
          key={index}
          year={date.year}
          month={date.month}
          day={date.day}
          isCurrentMonth={date.isCurrentMonth}
        />
      ))}
    </div>
  )
}

const getFirstDayByDate = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()

  return getFirstDayOfMonth(year, month)
}

const getDaysInMonthByDate = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()

  return getDaysInMonth(year, month)
}

const getPreviousMonthDays = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()

  const previousYear = month === 1 ? year - 1 : year
  const previousMonth = (month - 1) % 12
  return getDaysInMonth(previousYear, previousMonth)
}


type DateButtonProps = {
  year: number
  month: number
  day: number
  isCurrentMonth?: boolean
}

const DateButton = (props: DateButtonProps) => {
  const { day, isCurrentMonth = true } = props
  const textColor = isCurrentMonth ? "text-gray-700" : "text-gray-400"
  return (
    <button className={`py-2 rounded-full text-sm hover:bg-blue-100 transition-colors duration-200 ${textColor}`}>
      {day}
    </button>
  )
}