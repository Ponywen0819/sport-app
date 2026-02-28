import { cookies } from "next/headers";
import { type CalendarDate } from "@/components/date-selector";
import { WorkoutsClient } from "./components/workouts-client";
import { NotConfigured } from "@/components/not-configured";
import { getCurrentDate } from "@/utils/time";

const Page = async () => {
  const cookieStore = await cookies();

  const isConfigured =
    !!cookieStore.get("notion_token")?.value &&
    !!cookieStore.get("notion_exercise_records_db_id")?.value;

  const date = getCurrentDateByCookie(cookieStore);

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-stone-100">運動紀錄</h1>
      </div>
      {isConfigured ? <WorkoutsClient initialDate={date} /> : <NotConfigured />}
    </div>
  );
};

const getCurrentDateByCookie = (
  cookieStore: Awaited<ReturnType<typeof cookies>>
): CalendarDate => {
  const storedDate = cookieStore.get("date");
  if (!storedDate) {
    const currentDate = getCurrentDate();
    return {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth(),
      day: currentDate.getDate(),
    };
  }
  const [year, month, day] = storedDate.value.split("-").map(Number);
  return { year, month, day };
};

export default Page;
