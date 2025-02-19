import {
  CalendarDate,
  getCurrentCalendarDate,
} from "@/components/date-selector";
import { createStore } from "zustand/vanilla";
import Cookies from "js-cookie";
import { getCurrentDate } from "@/utils/time";

export type DateState = {
  date: CalendarDate;
};

export type DateActions = {
  setDate: (date: CalendarDate) => void;
};

export type DateStore = DateState & DateActions;

export const defaultInitState: DateState = {
  date: getCurrentCalendarDate(),
};

export const createDateStore = (initState: DateState = defaultInitState) => {
  return createStore<DateStore>()((set) => ({
    ...initState,
    setDate: (date) => {
      const dateString = new Date(date.year, date.month, date.day)
        .toISOString()
        .split("T")[0];
      const cookieExpireDate = getCurrentDate().setHours(23, 59, 59, 999);
      Cookies.set("date", dateString, { expires: cookieExpireDate });
      console.log("DateStore setDate", date);
      set({ date });
    },
  }));
};
