import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export const DateSelector = () => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-3  w-xs mx-auto text-stone-900">
      <MonthNavigator />
      <WeekdayHeader />
      <Calendar />
    </div>
  );
};

type MonthNavigatorProps = {
  monthDisplay?: string;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
};

export const MonthNavigator = (props: MonthNavigatorProps) => {
  const { monthDisplay = "2023 - Oct", onPrevMonth, onNextMonth } = props;

  return (
    <div className="flex justify-between items-center mb-4">
      <button
        onClick={onPrevMonth}
        className="  text-gray-500 hover:text-gray-700"
      >
        <FaChevronLeft size={12} />
      </button>
      <button className="text-sm text-gray-500">{monthDisplay}</button>
      <button
        onClick={onNextMonth}
        className="text-gray-500 hover:text-gray-700"
      >
        <FaChevronRight size={12} />
      </button>
    </div>
  );
};

const WeekdayHeader = () => {
  const daysAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div className="grid grid-cols-7 gap-1 text-center mb-2">
      {daysAbbr.map((day, index) => (
        <WeekdayName key={index} day={day} />
      ))}
    </div>
  );
};

type WeekdayNameProps = {
  day: string;
};

const WeekdayName = (props: WeekdayNameProps) => {
  return <div className="text-xs font-bold text-gray-400">{props.day}</div>;
};

const Calendar = () => {
  const dates = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-7 gap-2 text-center">
      {dates.map((date) => (
        <DateButton key={date} date={date} />
      ))}
    </div>
  );
};

type DateButtonProps = {
  date: number;
};

const DateButton = (props: DateButtonProps) => {
  const { date } = props;
  return (
    <button className="py-2 rounded-full text-sm hover:bg-blue-100 transition-colors duration-200">
      {date}
    </button>
  );
};
