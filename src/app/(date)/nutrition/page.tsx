import { cookies } from "next/headers";
import { CalendarDate, DateSelector } from "@/components/date-selector";
import { MealTracker } from "./components/meal-tracker";
import { NutritionOverview } from "./components/nutrition-overview";
import { NotConfigured } from "@/components/not-configured";
import { getCurrentDate } from "@/utils/time";

const Page = async () => {
  const cookieStore = await cookies();

  const isConfigured =
    !!cookieStore.get("notion_token")?.value &&
    !!cookieStore.get("notion_meal_items_db_id")?.value &&
    !!cookieStore.get("notion_foods_db_id")?.value;

  if (!isConfigured) {
    return (
      <div className="flex flex-col">
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-xl font-bold text-stone-100">今日飲食</h1>
        </div>
        <NotConfigured />
      </div>
    );
  }

  const date = getCurrentDateByCookie(cookieStore);

  return <NutritionPage date={date} />;
};

type NutritionPageProps = {
  date: CalendarDate;
};

const NutritionPage = (props: NutritionPageProps) => {
  const { date } = props;

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-stone-100">今日飲食</h1>
      </div>

      <div className="px-4 pb-2">
        <DateSelector />
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
    </div>
  );
};

const getCurrentDateByCookie = (
  cookieStore: Awaited<ReturnType<typeof cookies>>
) => {
  const storedDate = cookieStore.get("date");
  if (!storedDate) {
    const currentDate = getCurrentDate();
    return {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth(),
      day: currentDate.getDate(),
    } as CalendarDate;
  }

  const [year, month, day] = storedDate.value.split("-").map(Number);
  return { year, month, day } as CalendarDate;
};

export default Page;
