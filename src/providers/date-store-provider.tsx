"use client";

import {
  type ReactNode,
  createContext,
  useRef,
  useContext,
  useEffect,
} from "react";
import { useStore } from "zustand";
import Cookies from "js-cookie";
import { type DateStore, createDateStore } from "@/stores/date-store";
import { getCurrentDate } from "@/utils/time";

export type DateStoreApi = ReturnType<typeof createDateStore>;

export const DateStoreContext = createContext<DateStoreApi | undefined>(
  undefined
);

export interface DateStoreProviderProps {
  children: ReactNode;
}

export const DateStoreProvider = ({ children }: DateStoreProviderProps) => {
  const storeRef = useRef<DateStoreApi>(undefined);
  if (!storeRef.current) {
    storeRef.current = createDateStore();
  }

  useEffect(() => {
    if (!storeRef.current) return;
    console.log("DateStoreProvider useEffect");
    let dateString = Cookies.get("date");
    if (!dateString) {
      const now = getCurrentDate();
      dateString = now.toISOString().split("T")[0];
      Cookies.set("date", dateString, {
        expires: now.setHours(23, 59, 59, 999),
      });
    }

    const date = convertDateStringToCalendarDate(dateString);
    storeRef.current.setState({ date });
  }, []);

  return (
    <DateStoreContext.Provider value={storeRef.current}>
      {children}
    </DateStoreContext.Provider>
  );
};

export const useDateStore = <T,>(selector: (store: DateStore) => T): T => {
  const context = useContext(DateStoreContext);

  if (!context) {
    throw new Error(`useDateStore must be used within DateStoreProvider`);
  }

  return useStore(context, selector);
};

const convertDateStringToCalendarDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);

  return { year, month, day };
};
